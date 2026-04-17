"""
AI Strategy Engine
Handles multi-model parallel evaluation of user intents.
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from typing import Final

from backend.models import ModelExecutionResponse, StrategyResult

@dataclass(frozen=True)
class ModelProfile:
    name: str
    route_bias: list[str]
    confidence: float
    risk_bias: float
    fee_bias: float
    latency_ms: int

# Configuration for available AI models
MODEL_PROFILES: Final = (
    ModelProfile("gpt-strategy", ["XLM", "AQUA", "USDC"], 0.92, 0.18, 0.0018, 120),
    ModelProfile("claude-strategy", ["XLM", "yUSDC", "USDC"], 0.88, 0.12, 0.0014, 160),
    ModelProfile("llama-local", ["XLM", "USDC"], 0.79, 0.21, 0.0011, 80),
)

async def _evaluate_profile(
    profile: ModelProfile, 
    intent: dict[str, str | float | int | list[str]]
) -> StrategyResult:
    # Simulate model processing latency
    await asyncio.sleep(profile.latency_ms / 1000)

    amount = float(intent["amount"])
    urgency = intent["urgency"]
    
    # Construct optimal route based on model bias
    route = [profile.route_bias[0], *profile.route_bias[1:-1], str(intent["destination_asset"])]
    
    # Calculate performance metrics
    urgency_penalty = 0.006 if urgency == "high" else 0.0
    output = round(amount * (0.992 - profile.fee_bias - urgency_penalty), 6)
    fee = round(amount * profile.fee_bias, 6)
    risk = round(profile.risk_bias + urgency_penalty, 4)

    return StrategyResult(
        model=profile.name,
        route=route,
        output=output,
        fee=fee,
        risk=risk,
        confidence=profile.confidence,
        reasoning=f"{profile.name} optimized route {' -> '.join(route)} for liquidity/urgency balance."
    )

async def run_models(intent: dict[str, str | float | int | list[str]]) -> ModelExecutionResponse:
    """Executes all available strategy models in parallel and selects the primary winner."""
    results = await asyncio.gather(*[_evaluate_profile(p, intent) for p in MODEL_PROFILES])
    
    # Selection logic: balance output efficiency with confidence and risk
    best = max(results, key=lambda res: res.output * res.confidence - res.fee - res.risk)
    
    return ModelExecutionResponse(
        results=results, 
        best_model=best.model, 
        reasoning=f"Selected {best.model} for its optimal confidence-adjusted performance profile."
    )
