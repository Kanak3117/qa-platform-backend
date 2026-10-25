import json
import os
import unittest
from unittest.mock import MagicMock, patch
from urllib.error import HTTPError

from fastapi import HTTPException
from pydantic import ValidationError

from app.ai.schemas import AnalyzeBugRequest, BugCandidate
from app.ai.service import _OUTPUT_SCHEMA, _call_model, analyze_bug


class AIServiceTests(unittest.TestCase):
    def test_missing_key_returns_service_unavailable(self):
        with patch.dict(os.environ, {"OPENAI_API_KEY": ""}, clear=False):
            with patch("app.ai.service.urlopen") as urlopen:
                with self.assertRaises(HTTPException) as raised:
                    _call_model("Checkout failed after payment", None)

        self.assertEqual(raised.exception.status_code, 503)
        urlopen.assert_not_called()

    def test_request_uses_configured_model_and_structured_output(self):
        response = MagicMock()
        response.__enter__.return_value.read.return_value = json.dumps(
            {"choices": [{"message": {"content": '{"ok": true}'}}]}
        ).encode()
        with patch.dict(os.environ, {
            "OPENAI_API_KEY": "test-key",
            "OPENAI_MODEL": "test-model",
            "OPENAI_BASE_URL": "https://example.test/v1/",
        }, clear=False):
            with patch("app.ai.service.urlopen", return_value=response) as urlopen:
                result = _call_model("Checkout failed", "Payment issue")

        self.assertEqual(result, {"ok": True})
        request = urlopen.call_args.args[0]
        self.assertEqual(request.full_url, "https://example.test/v1/chat/completions")
        self.assertEqual(request.get_header("Authorization"), "Bearer test-key")
        body = json.loads(request.data)
        self.assertEqual(body["model"], "test-model")
        self.assertEqual(body["response_format"]["type"], "json_schema")
        self.assertTrue(body["response_format"]["json_schema"]["strict"])
        self.assertEqual(body["response_format"]["json_schema"]["schema"]["properties"]["priority"]["enum"], ["P1", "P2", "P3", "P4"])

    def test_provider_http_error_maps_to_bad_gateway(self):
        error = HTTPError("https://api.openai.com/v1/chat/completions", 401, "unauthorized", {}, None)
        with patch.dict(os.environ, {"OPENAI_API_KEY": "test-key"}, clear=False):
            with patch("app.ai.service.urlopen", side_effect=error):
                with self.assertRaises(HTTPException) as raised:
                    _call_model("Checkout failed", None)
        self.assertEqual(raised.exception.status_code, 502)

    def test_invalid_model_fields_are_rejected(self):
        payload = AnalyzeBugRequest(description="A payment fails after the card is charged.")
        with patch("app.ai.service._call_model", return_value={
            "suggested_title": "Payment fails", "category": "API / Backend",
            "severity": "urgent", "priority": "P2",
            "rationale": "The report does not describe impact.",
        }):
            with self.assertRaises(HTTPException) as raised:
                analyze_bug(payload)
        self.assertEqual(raised.exception.status_code, 502)

    def test_severity_and_priority_are_independent_project_labels(self):
        payload = AnalyzeBugRequest(description="Dashboard crashes for all authenticated users.")
        with patch("app.ai.service._call_model", return_value={
            "suggested_title": "Dashboard crashes for signed-in users",
            "category": "Stability", "severity": "Critical", "priority": "P2",
            "rationale": "The dashboard is unavailable to authenticated users.",
        }):
            result = analyze_bug(payload)
        self.assertEqual(result.severity, "Critical")
        self.assertEqual(result.priority, "P2")

    def test_informational_severity_is_supported(self):
        payload = AnalyzeBugRequest(description="A report lacks evidence of a user-impacting defect.")
        with patch("app.ai.service._call_model", return_value={
            "suggested_title": "No confirmed user impact",
            "category": "Other", "severity": "Informational", "priority": "P4",
            "rationale": "The report does not establish a user-facing defect.",
        }):
            result = analyze_bug(payload)
        self.assertEqual(result.severity, "Informational")

    def test_blank_description_is_rejected_before_provider_call(self):
        with self.assertRaises(ValidationError):
            AnalyzeBugRequest(description="          ")

    def test_analyze_returns_database_candidate_matches(self):
        payload = AnalyzeBugRequest(
            title="Payment charged but checkout fails",
            description="Checkout fails after charging the payment card.",
        )
        candidates = [BugCandidate(
            id="BUG-7", title="Payment charged but checkout failed",
            description="Card is charged but no order is created.",
        )]
        with patch("app.ai.service._call_model", return_value={
            "suggested_title": "  Checkout   fails after payment  ",
            "category": "Payment / Checkout", "severity": "High", "priority": "P2",
            "rationale": "The payment flow is blocked.",
        }):
            result = analyze_bug(payload, candidates)
        self.assertEqual(result.suggested_title, "Checkout fails after payment")
        self.assertEqual(result.severity, "High")
        self.assertEqual(result.priority, "P2")
        self.assertTrue(result.requires_qa_review)
        self.assertEqual(result.duplicates[0].bug_id, "BUG-7")


if __name__ == "__main__":
    unittest.main()
