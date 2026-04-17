"""
Solver Optimization Engine
Calculates execution strategies for multiple solver archetypes.
"""

from __future__ import annotations
from typing import Literal

from backend.models import SolverResult, StrategyResult

def calculate_amm_output(
    amount_in: float, 
    reserve_in: float, 
    reserve_out: float, 
    fee: float
) -> float:
    """Standard Constant Product AMM formula."""
    amount_after_fee = amount_in * (1 - fee)
    return (amount_after_fee * reserve_out) / (reserve_in + amount_after_fee)

def estimate_slippage(amount_in: float, reserve_in: float) -> float:
    """Estimates price impact based on pool depth."""
    return round(min(amount_in / max(reserve_in, 1), 0.99), 6)

def create_solver_result(
    sid: str,
    stype: Literal["fee", "output", "risk", "hybrid"],
    amount: float,
    res_in: float,
    res_out: float,
    base_fee: float,
    route: list[str],
    risk_base: float,
    multiplier: float,
) -> SolverResult:
    effective_fee = base_fee * multiplier
    output = calculate_amm_output(amount, res_in, res_out, effective_fee)
    slip = estimate_slippage(amount, res_in)
    
    # Calculate risk based on impact and relative liquidity
    depth_penalty = max(0.0, 0.25 - (res_in / 1_000_000))
    risk = round(risk_base + (slip * 0.6) + depth_penalty, 6)
    
    return SolverResult(
        solver_id=sid,
        solver_type=stype,
        output=round(output, 6),
        fee=round(amount * effective_fee, 6),
        slippage=slip,
        risk=risk,
        route=route,
        hooks={
            "dynamic_fee_multiplier": round(multiplier, 4),
            "custom_routing_bonus": round((1 - slip) * 0.03, 6),
        },
    )

def run_solvers(intent: dict[str, str | float | int | list[str]], model: StrategyResult) -> list[SolverResult]:
    """Simulates multiple solver strategies for a given intent and AI-selected route."""
    amount = float(intent["amount"])
    r_in, r_out = 900_000.0, 880_000.0
    route = model.route

    return [
        create_solver_result("fee-optimizer", "fee", amount, r_in, r_out, 0.0010, route, 0.10, 0.92),
        create_solver_result("output-optimizer", "output", amount, r_in * 1.2, r_out * 1.25, 0.0021, route, 0.18, 1.08),
        create_solver_result("risk-optimizer", "risk", amount, r_in * 1.4, r_out, 0.0014, route, 0.07, 0.97),
        create_solver_result("hybrid-v4-hook", "hybrid", amount, r_in * 1.1, r_out * 1.15, 0.0016, route, 0.11, 0.95),
    ]
