import math
import re
from collections import Counter

from app.ai.schemas import BugCandidate, DuplicateSuggestion

_TOKEN_RE = re.compile(r"[a-z0-9]+")
_STOP_WORDS = {
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "been",
    "by",
    "can",
    "for",
    "from",
    "in",
    "is",
    "it",
    "of",
    "on",
    "or",
    "that",
    "the",
    "this",
    "to",
    "was",
    "when",
    "with",
}


def _tokens(text: str) -> list[str]:
    return [t for t in _TOKEN_RE.findall(text.lower()) if len(t) > 1 and t not in _STOP_WORDS]


def _vector(tokens: list[str], document_frequency: Counter[str], count: int) -> dict[str, float]:
    term_frequency = Counter(tokens)
    vector = {
        term: (1 + math.log(freq)) * (math.log((1 + count) / (1 + document_frequency[term])) + 1)
        for term, freq in term_frequency.items()
    }
    norm = math.sqrt(sum(value * value for value in vector.values()))
    return {term: value / norm for term, value in vector.items()} if norm else {}


def find_duplicate_suggestions(
    description: str,
    candidates: list[BugCandidate],
    *,
    title: str | None = None,
    threshold: float = 0.22,
    limit: int = 5,
) -> list[DuplicateSuggestion]:
    """Return likely matches, highest similarity first; never makes merge decisions."""
    if not candidates:
        return []
    docs = [_tokens(f"{item.title} {item.description}") for item in candidates]
    all_docs = [_tokens(f"{title or ''} {description}"), *docs]
    df: Counter[str] = Counter()
    for tokens in all_docs:
        df.update(set(tokens))
    vectors = [_vector(tokens, df, len(all_docs)) for tokens in all_docs]
    query_vector = vectors[0]
    matches: list[DuplicateSuggestion] = []
    for candidate, vector in zip(candidates, vectors[1:]):
        similarity = sum(value * vector.get(term, 0.0) for term, value in query_vector.items())
        if similarity >= threshold:
            matches.append(
                DuplicateSuggestion(
                    bug_id=candidate.id,
                    title=candidate.title,
                    similarity=round(min(similarity, 1.0), 4),
                )
            )
    return sorted(matches, key=lambda item: item.similarity, reverse=True)[:limit]
