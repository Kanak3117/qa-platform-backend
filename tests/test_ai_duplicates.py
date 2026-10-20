import unittest

from app.ai.duplicates import find_duplicate_suggestions
from app.ai.schemas import BugCandidate


class DuplicateSuggestionTests(unittest.TestCase):
    def test_related_bug_ranks_first(self):
        candidates = [
            BugCandidate(id="1", title="Payment fails", description="Card charged but checkout reports transaction failed"),
            BugCandidate(id="2", title="Profile image", description="Uploading a new avatar returns an error"),
        ]
        matches = find_duplicate_suggestions("Checkout transaction fails after card payment is charged", candidates)
        self.assertTrue(matches)
        self.assertEqual(matches[0].bug_id, "1")

    def test_empty_candidate_list(self):
        self.assertEqual(find_duplicate_suggestions("Detailed issue report", []), [])

    def test_unrelated_bug_is_filtered(self):
        candidate = BugCandidate(id="1", title="Avatar upload", description="Profile picture upload is broken")
        matches = find_duplicate_suggestions("Payment checkout fails after card charge", [candidate])
        self.assertEqual(matches, [])


if __name__ == "__main__":
    unittest.main()
