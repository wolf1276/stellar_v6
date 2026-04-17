from __future__ import annotations

from fastapi import APIRouter, HTTPException

from backend.ai_engine import run_models
from backend.decision_engine import pick_best
from backend.intent_parser import parse_intent
from backend.models import (
    AnalyzeIntentResponse,
    BuildTransactionRequest,
    BuildTransactionResponse,
    IntentRequest,
    SubmitTransactionRequest,
    SubmitTransactionResponse,
)
from backend.solver_engine import run_solvers
from backend.stellar import build_unsigned_transaction, submit_signed_transaction


router = APIRouter(prefix="/api/v1")
transaction_history: list[SubmitTransactionResponse] = []


@router.post("/intent/analyze", response_model=AnalyzeIntentResponse)
async def analyze_intent(request: IntentRequest) -> AnalyzeIntentResponse:
    try:
        summary = parse_intent(request)
        model_execution = await run_models(summary)
        best_model = next(model for model in model_execution.results if model.model == model_execution.best_model)
        solver_results = run_solvers(summary, best_model)
        decision = pick_best(model_execution.results, solver_results)
        return AnalyzeIntentResponse(
            intent_summary=summary,
            model_execution=model_execution,
            solver_results=solver_results,
            decision=decision,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Internal engine error: {str(exc)}") from exc


@router.post("/transactions/build", response_model=BuildTransactionResponse)
def build_transaction(request: BuildTransactionRequest) -> BuildTransactionResponse:
    try:
        return build_unsigned_transaction(request)
    except Exception as exc:  # pragma: no cover - defensive boundary for SDK errors
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/transactions/submit", response_model=SubmitTransactionResponse)
def submit_transaction(request: SubmitTransactionRequest) -> SubmitTransactionResponse:
    try:
        result = submit_signed_transaction(
            signed_xdr=request.signed_xdr,
            intent=request.intent,
            best_model=request.best_model,
            best_solver=request.best_solver,
        )
    except Exception as exc:  # pragma: no cover - defensive boundary for wallet/network errors
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    transaction_history.append(result)
    return result


@router.get("/transactions", response_model=list[SubmitTransactionResponse])
def list_transactions() -> list[SubmitTransactionResponse]:
    return list(reversed(transaction_history))
