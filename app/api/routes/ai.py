from uuid import UUID

from fastapi import APIRouter, Depends

from app.ai.schemas import AnalyzeBugRequest, AnalyzeBugResponse
from app.ai.service import analyze_bug
from app.api.deps import require_project_role
from app.models.project import Project

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
