from __future__ import annotations

from fastapi.testclient import TestClient

from backend.main import app


client = TestClient(app)


def test_health() -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_analyze_intent() -> None:
    response = client.post(
        "/api/v1/intent/analyze",
        json={"intent": "Send 100 XLM as USDC to Bob with lowest fee", "amount": 100},
    )
    assert response.status_code == 200
    payload = response.json()
    assert payload["model_execution"]["best_model"]
    assert len(payload["solver_results"]) == 4
    assert payload["decision"]["best_solver"]


def test_invalid_intent_rejected() -> None:
    response = client.post("/api/v1/intent/analyze", json={"intent": "bad", "amount": -1})
    assert response.status_code == 422
