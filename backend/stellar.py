from __future__ import annotations

import hashlib

from stellar_sdk import SorobanServer, TransactionBuilder, TransactionEnvelope, scval
from stellar_sdk.exceptions import PrepareTransactionException

from backend.config import TESTNET_PASSPHRASE, settings
from backend.models import BuildTransactionRequest, BuildTransactionResponse, SubmitTransactionResponse


def _symbol_slug(value: str) -> str:
    sanitized = "".join(char if char.isalnum() else "_" for char in value.lower())
    return sanitized[:32] or "unknown"


def build_unsigned_transaction(request: BuildTransactionRequest) -> BuildTransactionResponse:
    if settings.network_passphrase != TESTNET_PASSPHRASE:
        raise ValueError("Backend must use the Stellar testnet passphrase exactly.")
    if not settings.soroban_contract_id:
        raise ValueError("SIE_SOROBAN_CONTRACT_ID must be configured for Soroban simulation.")

    soroban_server = SorobanServer(settings.soroban_rpc_url)
    source_account = soroban_server.load_account(request.source_public_key)
    intent_hash = hashlib.sha256(request.intent.encode("utf-8")).digest()

    tx = (
        TransactionBuilder(
            source_account=source_account,
            network_passphrase=settings.network_passphrase,
            base_fee=100,
        )
        .append_invoke_contract_function_op(
            contract_id=settings.soroban_contract_id,
            function_name="log_execution",
            parameters=[
                scval.to_bytes(intent_hash),
                scval.to_symbol(_symbol_slug(request.best_model)),
                scval.to_symbol(_symbol_slug(request.best_solver)),
                scval.to_string(request.source_public_key),
            ],
        )
        .set_timeout(300)
        .build()
    )

    simulation = soroban_server.simulate_transaction(tx)
    if simulation.error:
        raise ValueError(f"Soroban simulation failed: {simulation.error}")

    try:
        prepared = soroban_server.prepare_transaction(tx, simulation)
    except PrepareTransactionException as exc:  # pragma: no cover
        raise ValueError(f"Failed to assemble transaction after simulation: {exc}") from exc

    return BuildTransactionResponse(
        xdr=prepared.to_xdr(),
        network_passphrase=settings.network_passphrase,
        source_account=request.source_public_key,
        destination=request.destination_public_key,
        simulation={
            "min_resource_fee": simulation.min_resource_fee,
            "transaction_data": simulation.transaction_data,
            "result_count": len(simulation.results or []),
            "latest_ledger": simulation.latest_ledger,
        },
        explanation="Unsigned Soroban invocation built, simulated via Soroban RPC, assembled with simulation data, and returned for Freighter signing.",
    )


def submit_signed_transaction(signed_xdr: str, intent: str, best_model: str, best_solver: str) -> SubmitTransactionResponse:
    envelope = TransactionEnvelope.from_xdr(signed_xdr, settings.network_passphrase)
    soroban_server = SorobanServer(settings.soroban_rpc_url)
    submission = soroban_server.send_transaction(envelope)
    tx_hash = submission.hash
    status = "submitted"
    ledger = None

    if submission.status.value.upper() != "PENDING":
        status = "mock_submitted" if not settings.submit_to_network else "submitted"
    else:
        final_result = soroban_server.poll_transaction(tx_hash)
        ledger = final_result.ledger

    return SubmitTransactionResponse(
        status=status,
        hash=tx_hash,
        ledger=ledger,
        soroban_event={
            "intent_hash": hashlib.sha256(intent.encode("utf-8")).hexdigest(),
            "best_model": best_model,
            "best_solver": best_solver,
        },
        explorer_url=f"https://stellar.expert/explorer/testnet/tx/{tx_hash}",
    )
