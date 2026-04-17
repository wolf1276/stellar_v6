from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import Mock, patch

from stellar_sdk import Keypair

from backend.models import BuildTransactionRequest
from backend.stellar import build_unsigned_transaction, submit_signed_transaction


def test_build_unsigned_transaction() -> None:
    source = Keypair.random().public_key
    destination = Keypair.random().public_key
    fake_tx = SimpleNamespace(to_xdr=lambda: "AAAA-prepared-xdr")
    fake_simulation = SimpleNamespace(
        error=None,
        min_resource_fee=12345,
        transaction_data="AAAA-sim-data",
        results=[{"ok": True}],
        latest_ledger=456,
    )
    fake_server = Mock()
    fake_server.load_account.return_value = SimpleNamespace(account=source, sequence=1)
    fake_server.simulate_transaction.return_value = fake_simulation
    fake_server.prepare_transaction.return_value = fake_tx

    fake_settings = SimpleNamespace(
        network_passphrase="Test SDF Network ; September 2015",
        soroban_contract_id="CDUMMYTESTCONTRACT",
        soroban_rpc_url="https://soroban-testnet.stellar.org:443",
    )

    with patch("backend.stellar.settings", fake_settings), patch(
        "backend.stellar.SorobanServer", return_value=fake_server
    ), patch(
        "backend.stellar.TransactionBuilder"
    ) as builder_cls:
        builder = builder_cls.return_value
        builder.append_invoke_contract_function_op.return_value = builder
        builder.set_timeout.return_value = builder
        builder.build.return_value = SimpleNamespace(to_xdr=lambda: "AAAA-built-xdr")

        response = build_unsigned_transaction(
            BuildTransactionRequest(
                intent="Send 100 XLM to destination as USDC",
                source_public_key=source,
                destination_public_key=destination,
                source_asset="XLM",
                destination_asset="USDC",
                amount=100,
                best_model="gpt-strategy",
                best_solver="hybrid-v4-hook",
                route=["XLM", "AQUA", "USDC"],
                destination_min=97.5,
            )
        )

    assert response.xdr
    assert response.network_passphrase
    assert response.simulation["min_resource_fee"] == 12345


def test_submit_signed_transaction() -> None:
    kp = Keypair.random()
    envelope_builder = Mock()
    envelope_builder.to_xdr.return_value = "AAAA-signed"
    fake_submission = SimpleNamespace(hash="abc123", status=SimpleNamespace(value="PENDING"))
    fake_poll = SimpleNamespace(ledger=789)
    fake_server = Mock()
    fake_server.send_transaction.return_value = fake_submission
    fake_server.poll_transaction.return_value = fake_poll

    tx = Mock()

    with patch("backend.stellar.TransactionEnvelope.from_xdr", return_value=tx), patch(
        "backend.stellar.SorobanServer", return_value=fake_server
    ):
        result = submit_signed_transaction("AAAA", "intent", "gpt", "hybrid")

    assert result.hash == "abc123"
    assert result.ledger == 789
