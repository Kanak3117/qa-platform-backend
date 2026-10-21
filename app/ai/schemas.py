from typing import Literal

from pydantic import BaseModel, Field, field_validator


class BugCandidate(BaseModel):
    id: str = Field(min_length=1, max_length=80)
    title: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1, max_length=10_000)

    @field_validator("id", "title", "description")
    @classmethod
    def trim_required_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("must not be blank")
        return value


class AnalyzeBugRequest(BaseModel):
    title: str | None = Field(default=None, max_length=200)
    description: str = Field(min_length=10, max_length=10_000)
    existing_bugs: list[BugCandidate] = Field(default_factory=list, max_length=500)

    @field_validator("title")
    @classmethod
    def trim_optional_title(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None

    @field_validator("description")
    @classmethod
    def trim_description(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("must not be blank")
        return value


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
