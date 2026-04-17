from __future__ import annotations

from backend.models import ComparisonRow, DecisionResponse, SolverResult, StrategyResult


def _normalize(values: list[float], inverse: bool = False) -> list[float]:
    low, high = min(values), max(values)
    if high == low:
        return [1.0 for _ in values]
    normalized = [(value - low) / (high - low) for value in values]
    return [1 - value for value in normalized] if inverse else normalized


def pick_best(
    models: list[StrategyResult],
    solvers: list[SolverResult],
    output_weight: float = 0.55,
    fee_weight: float = 0.20,
    risk_weight: float = 0.25,
) -> DecisionResponse:
    solver_outputs = _normalize([solver.output for solver in solvers])
    solver_fees = _normalize([solver.fee for solver in solvers], inverse=True)
    solver_risks = _normalize([solver.risk for solver in solvers], inverse=True)

    comparison: list[ComparisonRow] = []
    solver_scores: dict[str, float] = {}

    for solver, output_norm, fee_norm, risk_norm in zip(solvers, solver_outputs, solver_fees, solver_risks):
        score = output_weight * output_norm + fee_weight * fee_norm + risk_weight * risk_norm
        solver_scores[solver.solver_id] = score
        comparison.append(
            ComparisonRow(
                name=solver.solver_id,
                category="solver",
                output=solver.output,
                fee=solver.fee,
                risk=solver.risk,
                score=round(score, 6),
            )
        )

    model_outputs = _normalize([model.output for model in models])
    model_fees = _normalize([model.fee for model in models], inverse=True)
    model_risks = _normalize([model.risk for model in models], inverse=True)
    model_scores: dict[str, float] = {}

    for model, output_norm, fee_norm, risk_norm in zip(models, model_outputs, model_fees, model_risks):
        score = output_weight * output_norm + fee_weight * fee_norm + risk_weight * risk_norm + (model.confidence * 0.1)
        model_scores[model.model] = score
        comparison.append(
            ComparisonRow(
                name=model.model,
                category="model",
                output=model.output,
                fee=model.fee,
                risk=model.risk,
                confidence=model.confidence,
                score=round(score, 6),
            )
        )

    best_solver = max(solver_scores, key=solver_scores.get)
    best_model = max(model_scores, key=model_scores.get)
    explanation = (
        f"Selected solver {best_solver} and model {best_model} using normalized multi-objective scoring: "
        f"score = {output_weight:.2f}*output - {fee_weight:.2f}*fee - {risk_weight:.2f}*risk, "
        "with model confidence used as a tie-breaker."
    )
    comparison.sort(key=lambda row: row.score, reverse=True)
    return DecisionResponse(
        best_solver=best_solver,
        best_model=best_model,
        comparison_table=comparison,
        explanation=explanation,
    )
