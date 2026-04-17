from __future__ import annotations

from backend.ai_engine import run_models
from backend.intent_parser import parse_intent
from backend.models import IntentRequest
from backend.solver_engine import run_solvers


async def _solver_fixture():
    summary = parse_intent(IntentRequest(intent="Convert 100 XLM into USDC safely", amount=100))
    models = await run_models(summary)
    best_model = next(model for model in models.results if model.model == models.best_model)
    return run_solvers(summary, best_model)


def test_solver_outputs_are_positive(anyio_backend: str = "asyncio") -> None:
    import asyncio

    solvers = asyncio.run(_solver_fixture())
    assert all(solver.output > 0 for solver in solvers)
    assert all(solver.fee >= 0 for solver in solvers)


def test_low_liquidity_has_slippage(anyio_backend: str = "asyncio") -> None:
    import asyncio

    solvers = asyncio.run(_solver_fixture())
    assert any(solver.slippage > 0 for solver in solvers)
