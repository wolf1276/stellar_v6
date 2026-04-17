import pytest
from backend.ai_engine import run_models
from backend.solver_engine import run_solvers
from backend.intent_parser import parse_intent
from backend.models import IntentRequest

@pytest.mark.asyncio
async def test_end_to_end_engine_flow():
    # 1. Parse intent
    intent_str = "Swap 500 XLM for USDC with low risk"
    request = IntentRequest(intent=intent_str, amount=500)
    summary = parse_intent(request)
    
    assert summary["amount"] == 500
    assert "USDC" in summary["constraints"]

    # 2. Run AI Models
    model_response = await run_models(summary)
    assert len(model_response.results) == 3
    assert model_response.best_model in ["gpt-strategy", "claude-strategy", "llama-local"]

    # 3. Run Solvers
    best_model = next(m for m in model_response.results if m.model == model_response.best_model)
    solver_results = run_solvers(summary, best_model)
    
    assert len(solver_results) == 4
    assert any(s.solver_id == "fee-optimizer" for s in solver_results)
    assert all(s.output > 0 for s in solver_results)

def test_intent_parser_validation():
    # Test valid amount extraction
    summary = parse_intent(IntentRequest(intent="Transfer 750.50 XLM", amount=100))
    assert summary["amount"] == 750.50

    # Test failure on negative/zero amounts (handled by pydantic or parser)
    with pytest.raises(ValueError, match="positive amount"):
        parse_intent(IntentRequest(intent="Send 0 XLM", amount=0))
