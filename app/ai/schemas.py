from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator

# These values align with the app's bug form and the supplied QA sample while
# keeping the previous AI route labels accepted for compatibility.
Category = Literal[
    "Payment / Checkout",
    "Authentication",
    "Performance",
    "UI / UX",
    "API / Backend",
    "Security",
    "Functional",
    "Stability",
    "API",
    "Data Integrity",
    "Database",
    "Integration",
    "Other",
    "UI/UX",
    "API/Backend",
]
Severity = Literal["Critical", "High", "Medium", "Low", "Informational"]
Priority = Literal["P1", "P2", "P3", "P4"]


class BugCandidate(BaseModel):
    id: str = Field(min_length=1, max_length=80)
    title: str = Field(min_length=1, max_length=300)
    description: str = Field(min_length=1, max_length=10_000)

    @field_validator("id", "title", "description")
    @classmethod
    def trim_required_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("must not be blank")
        return value


class AnalyzeBugRequest(BaseModel):
    title: str | None = Field(default=None, max_length=300)
    description: str = Field(min_length=10, max_length=10_000)

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
    category: Category
    severity: Severity
    priority: Priority
    rationale: str = Field(min_length=1, max_length=500)
    duplicates: list[DuplicateSuggestion]
    duplicate_method: Literal["tfidf_cosine"] = "tfidf_cosine"
    requires_qa_review: Literal[True] = True


class PersistedBugAnalysisResponse(BaseModel):
    bug_id: UUID
    analysis_id: UUID
    analysis: AnalyzeBugResponse


class LabeledEvaluationCase(BaseModel):
    case_id: str = Field(min_length=1, max_length=80)
    source_bug_code: str | None = Field(default=None, max_length=50)
    title: str | None = Field(default=None, max_length=300)
    description: str = Field(min_length=10, max_length=10_000)
    expected_category: Category
    expected_severity: Severity
    expected_priority: Priority
    accepted_titles: list[str] = Field(min_length=1, max_length=5)
    # Set true only when a reviewer has checked every possible duplicate label,
    # including cases with no duplicates. Otherwise duplicate metrics stay null.
    duplicate_labels_complete: bool = False
    expected_duplicate_ids: list[str] = Field(default_factory=list, max_length=500)

    @field_validator("case_id")
    @classmethod
    def trim_case_id(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("case_id must not be blank")
        return value

    @field_validator("source_bug_code")
    @classmethod
    def trim_source_bug_code(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None

    @field_validator("title")
    @classmethod
    def trim_case_title(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None

    @field_validator("description")
    @classmethod
    def trim_case_description(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("description must not be blank")
        return value

    @field_validator("accepted_titles")
    @classmethod
    def trim_accepted_titles(cls, values: list[str]) -> list[str]:
        cleaned = [value.strip() for value in values if value.strip()]
        if not cleaned:
            raise ValueError("provide at least one human-approved title")
        if len(cleaned) != len(set(title.casefold() for title in cleaned)):
            raise ValueError("accepted_titles must be unique")
        return cleaned

    @field_validator("expected_duplicate_ids")
    @classmethod
    def trim_expected_duplicate_ids(cls, values: list[str]) -> list[str]:
        cleaned = [value.strip() for value in values]
        if any(not value for value in cleaned):
            raise ValueError("expected duplicate IDs must not be blank")
        if len(cleaned) != len(set(cleaned)):
            raise ValueError("expected duplicate IDs must be unique")
        return cleaned

    @model_validator(mode="after")
    def validate_duplicate_label_state(self):
        if self.expected_duplicate_ids and not self.duplicate_labels_complete:
            raise ValueError(
                "mark duplicate_labels_complete true when supplying reviewed duplicate IDs"
            )
        return self


class EvaluateAIRequest(BaseModel):
    dataset_name: str | None = Field(default=None, min_length=1, max_length=100)
    cases: list[LabeledEvaluationCase] = Field(min_length=1, max_length=10)

    @field_validator("dataset_name")
    @classmethod
    def trim_dataset_name(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None

    @model_validator(mode="after")
    def validate_unique_case_ids(self):
        case_ids = [case.case_id.casefold() for case in self.cases]
        if len(case_ids) != len(set(case_ids)):
            raise ValueError("case_id values must be unique within a dataset")
        return self


class EvaluationMetrics(BaseModel):
    provider_success_rate: float = Field(ge=0, le=1)
    category_accuracy: float | None = Field(default=None, ge=0, le=1)
    severity_accuracy: float | None = Field(default=None, ge=0, le=1)
    priority_accuracy: float | None = Field(default=None, ge=0, le=1)
    severity_priority_pair_accuracy: float | None = Field(default=None, ge=0, le=1)
    title_acceptance_rate: float | None = Field(default=None, ge=0, le=1)
    duplicate_precision_at_5: float | None = Field(default=None, ge=0, le=1)
    duplicate_recall_at_5: float | None = Field(default=None, ge=0, le=1)
    model_success_denominator: int = Field(ge=0)
    duplicate_precision_denominator: int = Field(ge=0)
    duplicate_recall_denominator: int = Field(ge=0)


class EvaluationCaseResult(BaseModel):
    case_id: str
    provider_status: Literal["success", "error"]
    provider_error_code: int | None = None
    prediction: AnalyzeBugResponse | None = None
    duplicate_suggestions: list[DuplicateSuggestion] = Field(default_factory=list)
    category_correct: bool | None = None
    severity_correct: bool | None = None
    priority_correct: bool | None = None
    severity_priority_pair_correct: bool | None = None
    title_accepted: bool | None = None
    duplicate_precision_at_5: float | None = Field(default=None, ge=0, le=1)
    duplicate_recall_at_5: float | None = Field(default=None, ge=0, le=1)


class EvaluateAIResponse(BaseModel):
    dataset_name: str | None
    evaluation_scope: Literal["submitted_labeled_sample"] = "submitted_labeled_sample"
    model: str
    completed_at: datetime
    sample_count: int = Field(ge=1)
    provider_success_count: int = Field(ge=0)
    provider_failure_count: int = Field(ge=0)
    metrics: EvaluationMetrics
    results: list[EvaluationCaseResult]
    disclaimer: str = (
        "Metrics describe only this submitted labeled sample; they are not a guarantee "
        "of general model accuracy. Review cases and labels before reporting results."
    )
