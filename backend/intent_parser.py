from __future__ import annotations

import hashlib
import re

from backend.config import settings
from backend.models import IntentRequest


ASSET_PATTERN = re.compile(r"\b(XLM|USDC|USDT|EURC|BTC|ETH)\b", re.IGNORECASE)
AMOUNT_PATTERN = re.compile(r"(\d+(?:\.\d+)?)")


def parse_intent(request: IntentRequest) -> dict[str, str | float | int | list[str]]:
    assets = [match.upper() for match in ASSET_PATTERN.findall(request.intent)] or [
        request.source_asset.upper(),
        request.destination_asset.upper(),
    ]
    amount_match = AMOUNT_PATTERN.search(request.intent)
    if amount_match:
        amount = float(amount_match.group(1))
    else:
        # Fallback to request.amount if no amount in string, 
        # but if request.amount is the default 100.0 and string has no numbers, 
        # it might be unintentional. For now, we prefer explicit override.
        amount = request.amount
    
    if amount <= 0:
        raise ValueError("Intent must specify a positive amount (e.g., '100 XLM').")
    destination = request.destination or settings.default_destination
    urgency = "high" if any(word in request.intent.lower() for word in ["now", "fast", "urgent"]) else "normal"

    return {
        "intent": request.intent,
        "intent_hash": hashlib.sha256(request.intent.encode("utf-8")).hexdigest(),
        "source_asset": assets[0],
        "destination_asset": assets[-1],
        "amount": amount,
        "destination": destination,
        "urgency": urgency,
        "constraints": assets,
        "slippage_bps": request.slippage_bps,
    }
