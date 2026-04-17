from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, field_validator


class IntentRequest(BaseModel):
    intent: str = Field(min_length=5, max_length=280)
    source_asset: str = Field(default="XLM")
    destination_asset: str = Field(default="USDC")
    amount: float = Field(default=100.0, gt=0)
    destination: str | None = None
    slippage_bps: int = Field(default=150, ge=1, le=5_000)

    @field_validator("intent")
    @classmethod
    def normalize_intent(cls, value: str) -> str:
        return " ".join(value.split())


class StrategyResult(BaseModel):
    model: str
    route: list[str]
    output: float
    fee: float
    risk: float
    confidence: float
    reasoning: str


class ModelExecutionResponse(BaseModel):
    results: list[StrategyResult]
    best_model: str
    reasoning: str


class SolverResult(BaseModel):
    solver_id: str
    solver_type: Literal["fee", "output", "risk", "hybrid"]
    output: float
    fee: float
    slippage: float
    risk: float
    route: list[str]
    hooks: dict[str, float | str]


class ComparisonRow(BaseModel):
    name: str
    category: Literal["model", "solver"]
    output: float
    fee: float
    risk: float
    score: float
    confidence: float | None = None


class DecisionResponse(BaseModel):
    best_solver: str
    best_model: str
    comparison_table: list[ComparisonRow]
    explanation: str


class AnalyzeIntentResponse(BaseModel):
    intent_summary: dict[str, str | float | int | list[str]]
    model_execution: ModelExecutionResponse
    solver_results: list[SolverResult]
    decision: DecisionResponse


class BuildTransactionRequest(BaseModel):
    intent: str = Field(min_length=5, max_length=280)
    source_public_key: str = Field(min_length=56, max_length=56)
    destination_public_key: str = Field(min_length=56, max_length=56)
    source_asset: str = Field(default="XLM")
    destination_asset: str = Field(default="USDC")
    amount: float = Field(gt=0)
    best_model: str
    best_solver: str
    route: list[str] = Field(default_factory=list)
    destination_min: float = Field(gt=0)


class BuildTransactionResponse(BaseModel):
    xdr: str
    network_passphrase: str
    source_account: str
    destination: str
    simulation: dict[str, object]
    explanation: str


class SubmitTransactionRequest(BaseModel):
    signed_xdr: str = Field(min_length=16)
    intent: str = Field(min_length=5, max_length=280)
    best_model: str
    best_solver: str


class SubmitTransactionResponse(BaseModel):
    status: Literal["submitted", "mock_submitted"]
    hash: str
    ledger: int | None = None
    soroban_event: dict[str, str]
    explorer_url: str
