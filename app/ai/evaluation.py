import os
from datetime import datetime, timezone

from fastapi import HTTPException, status

from app.ai.duplicates import find_duplicate_suggestions
from app.ai.schemas import (
    AnalyzeBugRequest,
    AnalyzeBugResponse,
    EvaluateAIRequest,
    EvaluateAIResponse,
    EvaluationCaseResult,
    EvaluationMetrics,
)
from app.ai.service import analyze_bug


_PRIORITY_FOR_SEVERITY = {
    "Critical": "P0", "High": "P1", "Medium": "P2", "Low": "P3"
}


def _rate(correct: float, denominator: int) -> float | None:
    if denominator == 0:
        return None
    return round(correct / denominator, 4)


def _normalize_title(value: str) -> str:
    return " ".join(value.casefold().split())


def evaluate_labeled_dataset(payload: EvaluateAIRequest) -> EvaluateAIResponse:
    """Call the configured live model and score it against caller-supplied QA labels."""
    if not os.getenv("OPENAI_API_KEY", "").strip():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI evaluation is not configured (OPENAI_API_KEY is missing).",
        )

    results: list[EvaluationCaseResult] = []
    duplicate_precision_values: list[float] = []
    duplicate_recall_values: list[float] = []

    for case in payload.cases:
        try:
            prediction = analyze_bug(AnalyzeBugRequest(
                title=case.title,
                description=case.description,
                existing_bugs=case.existing_bugs,
            ))
            provider_status = "success"
            error_code = None
        except HTTPException as exc:
            if exc.status_code not in {502, 503}:
                raise
            prediction = None
            provider_status = "error"
            error_code = exc.status_code

        if prediction is not None:
            duplicate_suggestions = prediction.duplicates
            category_correct = prediction.category == case.expected_category
            severity_correct = prediction.severity == case.expected_severity
            priority_correct = prediction.priority == case.expected_priority
            pair_correct = (
                severity_correct
                and priority_correct
                and prediction.priority == _PRIORITY_FOR_SEVERITY[prediction.severity]
            )
            title_accepted = _normalize_title(prediction.suggested_title) in {
                _normalize_title(title) for title in case.accepted_titles
            }
        else:
            # Duplicate matching is local and can still be scored when the LLM provider fails.
            duplicate_suggestions = find_duplicate_suggestions(
                case.description, case.existing_bugs, title=case.title
            )
            category_correct = severity_correct = priority_correct = None
            pair_correct = title_accepted = None

        predicted_ids = [item.bug_id for item in duplicate_suggestions[:5]]
        expected_ids = set(case.expected_duplicate_ids)
        if case.existing_bugs:
            hits = len(set(predicted_ids) & expected_ids)
            precision_at_5 = round(hits / 5, 4)
            duplicate_precision_values.append(precision_at_5)
        else:
            precision_at_5 = None
        if expected_ids:
            recall_at_5 = round(len(set(predicted_ids) & expected_ids) / len(expected_ids), 4)
            duplicate_recall_values.append(recall_at_5)
        else:
            recall_at_5 = None

        results.append(EvaluationCaseResult(
            case_id=case.case_id,
            provider_status=provider_status,
            provider_error_code=error_code,
            prediction=prediction,
            duplicate_suggestions=duplicate_suggestions,
            category_correct=category_correct,
            severity_correct=severity_correct,
            priority_correct=priority_correct,
            severity_priority_pair_correct=pair_correct,
            title_accepted=title_accepted,
            duplicate_precision_at_5=precision_at_5,
            duplicate_recall_at_5=recall_at_5,
        ))

    successes = [result for result in results if result.provider_status == "success"]
    model_count = len(successes)
    metrics = EvaluationMetrics(
        provider_success_rate=_rate(model_count, len(payload.cases)) or 0.0,
        category_accuracy=_rate(sum(result.category_correct is True for result in successes), model_count),
        severity_accuracy=_rate(sum(result.severity_correct is True for result in successes), model_count),
        priority_accuracy=_rate(sum(result.priority_correct is True for result in successes), model_count),
        severity_priority_pair_accuracy=_rate(
            sum(result.severity_priority_pair_correct is True for result in successes), model_count
        ),
        title_acceptance_rate=_rate(sum(result.title_accepted is True for result in successes), model_count),
        duplicate_precision_at_5=_rate(sum(duplicate_precision_values), len(duplicate_precision_values)),
        duplicate_recall_at_5=_rate(sum(duplicate_recall_values), len(duplicate_recall_values)),
        model_success_denominator=model_count,
        duplicate_precision_denominator=len(duplicate_precision_values),
        duplicate_recall_denominator=len(duplicate_recall_values),
    )
    return EvaluateAIResponse(
        dataset_name=payload.dataset_name,
        model=os.getenv("OPENAI_MODEL", "gpt-4.1-mini").strip() or "gpt-4.1-mini",
        completed_at=datetime.now(timezone.utc),
        sample_count=len(payload.cases),
        provider_success_count=model_count,
        provider_failure_count=len(payload.cases) - model_count,
        metrics=metrics,
        results=results,
    )
