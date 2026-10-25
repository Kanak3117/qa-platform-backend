import os
import unittest
from types import SimpleNamespace
from unittest.mock import patch
from uuid import uuid4

os.environ.setdefault("DATABASE_URL", "sqlite://")
os.environ.setdefault("SECRET_KEY", "test-only-secret")

from fastapi import HTTPException

from app.ai.schemas import AnalyzeBugRequest, AnalyzeBugResponse, BugCandidate, DuplicateSuggestion, EvaluateAIRequest
from app.api.routes.ai import (
    _candidate_models,
    _candidates_by_case,
    _project_bug_rows,
    analyze_bug_endpoint,
    analyze_persisted_bug_endpoint,
)
from app.models import BugAIAnalysis


class _Rows:
    def __init__(self, rows):
        self._rows = rows

    def all(self):
        return self._rows


class _FakeDB:
    def __init__(self, rows=None, scalar_rows=None):
        self.rows = rows or []
        self.scalar_rows = list(scalar_rows or [])
        self.statements = []
        self.added = []
        self.committed = False

    def scalars(self, statement):
        self.statements.append(statement)
        return _Rows(self.rows)

    def scalar(self, statement):
        self.statements.append(statement)
        return self.scalar_rows.pop(0) if self.scalar_rows else None

    def add(self, row):
        self.added.append(row)

    def flush(self):
        for row in self.added:
            if isinstance(row, BugAIAnalysis) and row.id is None:
                row.id = uuid4()

    def commit(self):
        self.committed = True

    def refresh(self, _row):
        return None


def _bug(project_id, code, *, bug_id=None, description="The login action is unresponsive."):
    return SimpleNamespace(
        id=bug_id or uuid4(),
        bug_code=code,
        title=f"Title {code}",
        description=description,
        project_id=project_id,
        is_deleted=False,
        created_at=None,
    )


class AIDatabaseIntegrationTests(unittest.TestCase):
    def test_candidate_query_is_project_scoped_and_excludes_soft_deleted_bugs(self):
        project_id = uuid4()
        row = _bug(project_id, "BUG-1")
        db = _FakeDB(rows=[row])

        results = _project_bug_rows(db, project_id)

        self.assertEqual(results, [row])
        statement = str(db.statements[0])
        self.assertIn("bugs.project_id", statement)
        self.assertIn("bugs.is_deleted", statement)
        self.assertIn("LIMIT", statement.upper())
        self.assertEqual(_candidate_models(results)[0].id, "BUG-1")

    def test_evaluation_excludes_source_bug_and_uses_only_project_query_results(self):
        project_id = uuid4()
        source = _bug(project_id, "BUG-1")
        candidate = _bug(project_id, "BUG-2", description="The password reset email is not delivered.")
        payload = EvaluateAIRequest.model_validate({"cases": [{
            "case_id": "BUG-1",
            "source_bug_code": "BUG-1",
            "title": "Login action is unresponsive",
            "description": "The login action is unresponsive with a valid password.",
            "expected_category": "Authentication",
            "expected_severity": "High",
            "expected_priority": "P2",
            "accepted_titles": ["Login action is unresponsive"],
        }]})
        db = _FakeDB(rows=[source, candidate])

        candidates = _candidates_by_case(payload, db, project_id)

        self.assertEqual([item.id for item in candidates["BUG-1"]], ["BUG-2"])
        self.assertIn("bugs.project_id", str(db.statements[0]))

    def test_analyze_route_uses_database_candidates_instead_of_client_candidate_input(self):
        project_id = uuid4()
        candidate = _bug(project_id, "BUG-2")
        db = _FakeDB(rows=[candidate])
        payload = AnalyzeBugRequest(
            title="Login button broken",
            description="Clicking login with valid credentials has no response.",
        )
        expected = AnalyzeBugResponse(
            suggested_title="Login button gives no response",
            category="Authentication", severity="High", priority="P2",
            rationale="The login action does not respond.",
            duplicates=[DuplicateSuggestion(bug_id="BUG-2", title=candidate.title, similarity=0.7)],
        )
        with patch("app.api.routes.ai.analyze_bug", return_value=expected) as analyze:
            result = analyze_bug_endpoint(payload, project_id, SimpleNamespace(id=project_id), db)

        self.assertEqual(result, expected)
        analyze.assert_called_once()
        self.assertEqual(analyze.call_args.args[1][0].id, "BUG-2")

    def test_persisted_analysis_is_saved_without_mutating_bug(self):
        project_id = uuid4()
        bug = _bug(project_id, "BUG-1", description="Login button has no response.")
        db = _FakeDB(scalar_rows=[bug, None])
        prediction = AnalyzeBugResponse(
            suggested_title="Login button fails to respond",
            category="Authentication", severity="High", priority="P2",
            rationale="The login action is not responding.",
            duplicates=[DuplicateSuggestion(bug_id="BUG-2", title="Similar login issue", similarity=0.8)],
        )
        original_title = bug.title
        with patch("app.api.routes.ai.analyze_bug", return_value=prediction):
            result = analyze_persisted_bug_endpoint(
                bug.id, project_id, SimpleNamespace(id=project_id), db
            )

        self.assertEqual(result.bug_id, bug.id)
        self.assertTrue(db.committed)
        self.assertEqual(bug.title, original_title)
        saved = db.added[0]
        self.assertIsInstance(saved, BugAIAnalysis)
        self.assertEqual(saved.suggested_category, "Authentication")
        self.assertEqual(saved.suggested_priority, "P2")
        self.assertEqual(saved.duplicate_bug_ids, ["BUG-2"])
        self.assertIn("bugs.project_id", str(db.statements[0]))

    def test_other_project_bug_is_not_found(self):
        project_id = uuid4()
        db = _FakeDB(scalar_rows=[None])
        with self.assertRaises(HTTPException) as raised:
            analyze_persisted_bug_endpoint(uuid4(), project_id, SimpleNamespace(id=project_id), db)
        self.assertEqual(raised.exception.status_code, 404)


if __name__ == "__main__":
    unittest.main()
