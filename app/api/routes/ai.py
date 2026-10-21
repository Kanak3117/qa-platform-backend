from uuid import UUID

from fastapi import APIRouter, Depends

from app.ai.evaluation import evaluate_labeled_dataset
from app.ai.schemas import (
    AnalyzeBugRequest,
    AnalyzeBugResponse,
    EvaluateAIRequest,
    EvaluateAIResponse,
)
from app.ai.service import analyze_bug
from app.api.deps import require_project_role
from app.models.project import Project, ProjectRole

router = APIRouter(prefix="/api/projects/{project_id}/ai", tags=["AI bug assistance"])


@router.post("/analyze", response_model=AnalyzeBugResponse)
def analyze_bug_endpoint(
    payload: AnalyzeBugRequest,
    project_id: UUID,
    _project: Project = Depends(require_project_role()),
) -> AnalyzeBugResponse:
    """Suggest triage fields; never persists or automatically applies them.

    Supply existing_bugs from this project only.
    """
    return analyze_bug(payload)


@router.post("/evaluate", response_model=EvaluateAIResponse)
def evaluate_ai_endpoint(
    payload: EvaluateAIRequest,
    project_id: UUID,
    _project: Project = Depends(require_project_role(ProjectRole.QA_ENGINEER)),
) -> EvaluateAIResponse:
    """Evaluate the live model against a small, human-labeled dataset.

    The current repository has no bug table. Supply a curated candidate set per case;
    when bug persistence is integrated, load those candidates server-side by project.
    """
    return evaluate_labeled_dataset(payload)
