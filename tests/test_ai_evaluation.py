import os
import unittest
from unittest.mock import patch

os.environ.setdefault("DATABASE_URL", "sqlite://")
os.environ.setdefault("SECRET_KEY", "test-only-secret")

from fastapi import HTTPException
from pydantic import ValidationError

from app.ai.evaluation import evaluate_labeled_dataset
from app.ai.schemas import (
    AnalyzeBugResponse,
    BugCandidate,
    DuplicateSuggestion,
    EvaluateAIRequest,
    LabeledEvaluationCase,
)
from app.main import app


def _case(case_id, **overrides):
    case = {
        "case_id": case_id,
        "title": "Checkout payment failure",
        "description": "Checkout fails after the card is charged and no order appears.",
        "expected_category": "API / Backend",
        "expected_severity": "High",
        "expected_priority": "P2",
        "accepted_titles": ["Checkout fails after payment"],
        "duplicate_labels_complete": False,
        "expected_duplicate_ids": [],
    }
    case.update(overrides)
    return case


def _prediction(*, category="API / Backend", severity="High", priority="P2",
                title="Checkout fails after payment", duplicates=None):
    return AnalyzeBugResponse(
        suggested_title=title,
        category=category,
        severity=severity,
        priority=priority,
        rationale="The report describes a blocked checkout after payment.",
        duplicates=duplicates or [],
    )


class AIEvaluationTests(unittest.TestCase):
    def test_routes_are_registered(self):
        paths = set(app.openapi()["paths"])
        self.assertIn("/api/projects/{project_id}/ai/analyze", paths)
        self.assertIn("/api/projects/{project_id}/ai/bugs/{bug_id}/analyze", paths)
        self.assertIn("/api/projects/{project_id}/ai/evaluate", paths)

    def test_reports_live_metrics_and_denominators(self):
        candidate = BugCandidate(
            id="BUG-1", title="Card charged but order does not appear",
            description="Payment is captured but checkout creates no order.",
        )
        payload = EvaluateAIRequest.model_validate({
            "dataset_name": "reviewed-bug-set",
            "cases": [
                _case(
                    "PAY-1", expected_category="UI / UX",
                    duplicate_labels_complete=True, expected_duplicate_ids=["BUG-1"],
                ),
                _case(
                    "SEC-1", expected_category="Security",
                    expected_severity="Critical", expected_priority="P1",
                    accepted_titles=["Unauthorized customer data exposed"],
                ),
            ],
        })
        predictions = [
            _prediction(duplicates=[
                DuplicateSuggestion(bug_id="BUG-1", title=candidate.title, similarity=0.81)
            ]),
            _prediction(
                category="Security", severity="Critical", priority="P1",
                title="Account data exposed",
            ),
        ]
        with patch.dict(os.environ, {"OPENAI_API_KEY": "test-key"}):
            with patch("app.ai.evaluation.analyze_bug", side_effect=predictions):
                result = evaluate_labeled_dataset(
                    payload, {"PAY-1": [candidate], "SEC-1": []}
                )

        self.assertEqual(result.sample_count, 2)
        self.assertEqual(result.provider_success_count, 2)
        self.assertEqual(result.metrics.provider_success_rate, 1.0)
        self.assertEqual(result.metrics.category_accuracy, 0.5)
        self.assertEqual(result.metrics.severity_accuracy, 1.0)
        self.assertEqual(result.metrics.priority_accuracy, 1.0)
        self.assertEqual(result.metrics.severity_priority_pair_accuracy, 1.0)
        self.assertEqual(result.metrics.title_acceptance_rate, 0.5)
        self.assertEqual(result.metrics.duplicate_precision_at_5, 0.2)
        self.assertEqual(result.metrics.duplicate_recall_at_5, 1.0)
        self.assertEqual(result.metrics.duplicate_precision_denominator, 1)
        self.assertEqual(result.metrics.duplicate_recall_denominator, 1)

    def test_duplicate_metrics_are_null_without_reviewed_duplicate_labels(self):
        payload = EvaluateAIRequest.model_validate({"cases": [_case("BUG-1")]})
        candidate = BugCandidate(id="BUG-2", title="Similar bug", description="A different issue.")
        with patch.dict(os.environ, {"OPENAI_API_KEY": "test-key"}):
            with patch("app.ai.evaluation.analyze_bug", return_value=_prediction()):
                result = evaluate_labeled_dataset(payload, {"BUG-1": [candidate]})
        self.assertIsNone(result.metrics.duplicate_precision_at_5)
        self.assertIsNone(result.metrics.duplicate_recall_at_5)
        self.assertEqual(result.metrics.duplicate_precision_denominator, 0)

    def test_provider_failure_is_counted_and_local_duplicate_score_remains_available(self):
        candidate = BugCandidate(
            id="BUG-77", title="Checkout payment failure after card charge",
            description="Checkout fails after the card is charged and no order appears.",
        )
        payload = EvaluateAIRequest.model_validate({"cases": [_case(
            "PAY-77", duplicate_labels_complete=True, expected_duplicate_ids=["BUG-77"]
        )]})
        with patch.dict(os.environ, {"OPENAI_API_KEY": "test-key"}):
            with patch(
                "app.ai.evaluation.analyze_bug",
                side_effect=HTTPException(status_code=502, detail="provider failure"),
            ):
                result = evaluate_labeled_dataset(payload, {"PAY-77": [candidate]})

        self.assertEqual(result.provider_failure_count, 1)
        self.assertEqual(result.metrics.provider_success_rate, 0.0)
        self.assertIsNone(result.metrics.category_accuracy)
        self.assertEqual(result.metrics.duplicate_recall_at_5, 1.0)
        self.assertEqual(result.results[0].provider_error_code, 502)
        self.assertEqual(result.results[0].duplicate_suggestions[0].bug_id, "BUG-77")

    def test_missing_duplicate_code_is_rejected_for_project_database(self):
        payload = EvaluateAIRequest.model_validate({"cases": [_case(
            "PAY-77", duplicate_labels_complete=True, expected_duplicate_ids=["MISSING"]
        )]})
        with patch.dict(os.environ, {"OPENAI_API_KEY": "test-key"}):
            with self.assertRaises(HTTPException) as raised:
                evaluate_labeled_dataset(payload, {"PAY-77": []})
        self.assertEqual(raised.exception.status_code, 422)

    def test_missing_key_returns_503_without_provider_call(self):
        payload = EvaluateAIRequest.model_validate({"cases": [_case("PAY-1")]})
        with patch.dict(os.environ, {"OPENAI_API_KEY": ""}):
            with patch("app.ai.evaluation.analyze_bug") as analyze:
                with self.assertRaises(HTTPException) as raised:
                    evaluate_labeled_dataset(payload)
        self.assertEqual(raised.exception.status_code, 503)
        analyze.assert_not_called()

    def test_project_dataset_labels_match_supplied_bug_taxonomy(self):
        case = LabeledEvaluationCase.model_validate(_case(
            "BUG-003", expected_category="Stability", expected_severity="Critical",
            expected_priority="P2",
        ))
        self.assertEqual(case.expected_category, "Stability")
        self.assertEqual(case.expected_priority, "P2")

    def test_duplicate_ids_require_complete_human_labels(self):
        with self.assertRaises(ValidationError):
            LabeledEvaluationCase.model_validate(_case(
                "BAD-1", expected_duplicate_ids=["BUG-1"]
            ))

    def test_dataset_is_limited_to_ten_cases(self):
        with self.assertRaises(ValidationError):
            EvaluateAIRequest.model_validate({
                "cases": [_case(f"CASE-{i}") for i in range(11)]
            })


if __name__ == "__main__":
    unittest.main()
