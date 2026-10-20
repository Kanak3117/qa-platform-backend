from typing import Literal

from pydantic import BaseModel, Field


class BugCandidate(BaseModel):
    id: str = Field(min_length=1, max_length=80)
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1, max_length=10_000)


class AnalyzeBugRequest(BaseModel):
    title: str | None = Field(default=None, max_length=200)
    description: str = Field(min_length=10, max_length=10_000)
    existing_bugs: list[BugCandidate] = Field(default_factory=list, max_length=500)


class DuplicateSuggestion(BaseModel):
    bug_id: str
    title: str
    similarity: float = Field(ge=0, le=1)


class AnalyzeBugResponse(BaseModel):
    suggested_title: str = Field(min_length=5, max_length=120)
    category: Literal[
        "UI/UX", "API/Backend", "Authentication", "Database", "Performance",
        "Security", "Integration", "Other",
    ]
    severity: Literal["Critical", "High", "Medium", "Low"]
    priority: Literal["P0", "P1", "P2", "P3"]
    rationale: str = Field(min_length=1, max_length=500)
    duplicates: list[DuplicateSuggestion]
    duplicate_method: Literal["tfidf_cosine"] = "tfidf_cosine"
    requires_qa_review: Literal[True] = True
