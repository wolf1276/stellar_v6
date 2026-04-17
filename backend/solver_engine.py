from __future__ import annotations

from backend.models import SolverResult, StrategyResult


def _amm_out(amount_in: float, reserve_in: float, reserve_out: float, fee_rate: float) -> float:
    amount_in_with_fee = amount_in * (1 - fee_rate)
    return (amount_in_with_fee * reserve_out) / (reserve_in + amount_in_with_fee)


def _slippage(amount_in: float, reserve_in: float) -> float:
    return round(min(amount_in / max(reserve_in, 1), 0.99), 6)


def _make_solver(
    solver_id: str,
    solver_type: str,
    amount_in: float,
    reserve_in: float,
    reserve_out: float,
    fee_rate: float,
    route: list[str],
    risk_bias: float,
    hook_multiplier: float,
) -> SolverResult:
    effective_fee = fee_rate * hook_multiplier
    output = _amm_out(amount_in, reserve_in, reserve_out, effective_fee)
    slip = _slippage(amount_in, reserve_in)
    depth_penalty = max(0.0, 0.25 - (reserve_in / 1_000_000))
    risk = round(risk_bias + slip * 0.6 + depth_penalty, 6)
    return SolverResult(
        solver_id=solver_id,
        solver_type=solver_type,  # type: ignore[arg-type]
        output=round(output, 6),
        fee=round(amount_in * effective_fee, 6),
        slippage=slip,
        risk=risk,
        route=route,
        hooks={
            "dynamic_fee_multiplier": round(hook_multiplier, 4),
            "custom_routing_bonus": round((1 - slip) * 0.03, 6),
        },
    )


def run_solvers(intent_summary: dict[str, str | float | int | list[str]], best_model: StrategyResult) -> list[SolverResult]:
    amount_in = float(intent_summary["amount"])
    reserve_in = 900_000.0
    reserve_out = 880_000.0
    route = best_model.route

    return [
        _make_solver("fee-optimizer", "fee", amount_in, reserve_in, reserve_out, 0.0010, route, 0.10, 0.92),
        _make_solver("output-optimizer", "output", amount_in, reserve_in * 1.2, reserve_out * 1.25, 0.0021, route, 0.18, 1.08),
        _make_solver("risk-optimizer", "risk", amount_in, reserve_in * 1.4, reserve_out, 0.0014, route, 0.07, 0.97),
        _make_solver("hybrid-v4-hook", "hybrid", amount_in, reserve_in * 1.1, reserve_out * 1.15, 0.0016, route, 0.11, 0.95),
    ]
