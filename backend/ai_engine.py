from __future__ import annotations

import asyncio
from dataclasses import dataclass

from backend.models import ModelExecutionResponse, StrategyResult


@dataclass(frozen=True)
class ModelProfile:
    name: str
    route_bias: list[str]
    confidence: float
    risk_bias: float
    fee_bias: float
    latency_ms: int


MODEL_PROFILES = (
    ModelProfile("gpt-strategy", ["XLM", "AQUA", "USDC"], 0.92, 0.18, 0.0018, 120),
    ModelProfile("claude-strategy", ["XLM", "yUSDC", "USDC"], 0.88, 0.12, 0.0014, 160),
    ModelProfile("llama-local", ["XLM", "USDC"], 0.79, 0.21, 0.0011, 80),
)


async def _run_model(profile: ModelProfile, intent_summary: dict[str, str | float | int | list[str]]) -> StrategyResult:
    await asyncio.sleep(profile.latency_ms / 1000)

    amount = float(intent_summary["amount"])
    urgency = intent_summary["urgency"]
    route = [profile.route_bias[0], *profile.route_bias[1:-1], str(intent_summary["destination_asset"])]
    urgency_penalty = 0.006 if urgency == "high" else 0.0
    output = round(amount * (0.992 - profile.fee_bias - urgency_penalty), 6)
    fee = round(amount * profile.fee_bias, 6)
    risk = round(profile.risk_bias + urgency_penalty, 4)

    reasoning = (
        f"{profile.name} prefers route {' -> '.join(route)} because it balances liquidity depth, "
        f"expected execution price, and user urgency."
    )
    return StrategyResult(
        model=profile.name,
        route=route,
        output=output,
        fee=fee,
        risk=risk,
        confidence=profile.confidence,
        reasoning=reasoning,
    )


async def run_models(intent_summary: dict[str, str | float | int | list[str]]) -> ModelExecutionResponse:
    results = await asyncio.gather(*[_run_model(profile, intent_summary) for profile in MODEL_PROFILES])
    best = max(results, key=lambda item: item.output * item.confidence - item.fee - item.risk)
    reasoning = (
        f"{best.model} won the model round because it delivered the strongest output-adjusted confidence "
        f"after fee and risk penalties."
    )
    return ModelExecutionResponse(results=results, best_model=best.model, reasoning=reasoning)
