from __future__ import annotations

import os
from dataclasses import dataclass

from stellar_sdk import Network

TESTNET_PASSPHRASE = "Test SDF Network ; September 2015"


@dataclass(frozen=True)
class Settings:
    horizon_url: str = os.getenv("SIE_HORIZON_URL", "https://horizon-testnet.stellar.org")
    soroban_rpc_url: str = os.getenv("SIE_SOROBAN_RPC_URL", "https://soroban-testnet.stellar.org:443")
    network_passphrase: str = os.getenv("SIE_NETWORK_PASSPHRASE", TESTNET_PASSPHRASE)
    default_destination: str = os.getenv(
        "SIE_DEFAULT_DESTINATION",
        "GBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBR7K",
    )
    soroban_contract_id: str = os.getenv("SIE_SOROBAN_CONTRACT_ID", "")
    default_slippage_bps: int = int(os.getenv("SIE_DEFAULT_SLIPPAGE_BPS", "150"))
    submit_to_network: bool = os.getenv("SIE_SUBMIT_TO_NETWORK", "true").lower() == "true"


settings = Settings()
