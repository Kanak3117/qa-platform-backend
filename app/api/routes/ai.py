from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ai.evaluation import evaluate_labeled_dataset
from app.ai.schemas import (
    AnalyzeBugRequest,
    AnalyzeBugResponse,
    BugCandidate,
    EvaluateAIRequest,
    EvaluateAIResponse,
    PersistedBugAnalysisResponse,
)
from app.ai.service import analyze_bug
from app.api.deps import get_db, require_project_role
from app.models import Bug, BugAIAnalysis
from app.models.project import Project, ProjectRole

router = APIRouter(prefix="/api/projects/{project_id}/ai", tags=["AI bug assistance"])
_MAX_CANDIDATE_BUGS = 500


def _project_bug_rows(db: Session, project_id: UUID, *, exclude_bug_id: UUID | None = None):
    statement = select(Bug).where(
        Bug.project_id == project_id,
        Bug.is_deleted.is_(False),
    )
    if exclude_bug_id is not None:
        statement = statement.where(Bug.id != exclude_bug_id)
    statement = statement.order_by(Bug.created_at.desc()).limit(_MAX_CANDIDATE_BUGS)
    return db.scalars(statement).all()


def _candidate_models(rows) -> list[BugCandidate]:
    return [
        BugCandidate(
            id=row.bug_code,
            title=row.title[:300],
            description=(row.description or row.title or "Bug report without description")[:10_000],
        )
        for row in rows
    ]


def _candidates_by_case(payload: EvaluateAIRequest, db: Session, project_id: UUID):
    rows = _project_bug_rows(db, project_id)
    all_candidates = _candidate_models(rows)
    by_id = {candidate.id: candidate for candidate in all_candidates}
    result = {}
    for case in payload.cases:
        exclude_code = case.source_bug_code or case.case_id
        result[case.case_id] = [candidate for candidate in all_candidates if candidate.id != exclude_code]
        if case.duplicate_labels_complete:
            missing = set(case.expected_duplicate_ids) - set(by_id)
            if missing:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"case {case.case_id}: duplicate labels refer to bug codes outside this project",
                )
            if exclude_code in case.expected_duplicate_ids:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=f"case {case.case_id}: the source bug cannot be its own duplicate",
                )
    return result


@router.post("/analyze", response_model=AnalyzeBugResponse)
def analyze_bug_endpoint(
    payload: AnalyzeBugRequest,
    project_id: UUID,
    _project: Project = Depends(require_project_role()),
    db: Session = Depends(get_db),
) -> AnalyzeBugResponse:
    """Suggest triage fields and compare only with bugs in the authorized project."""
    candidates = _candidate_models(_project_bug_rows(db, project_id))
    return analyze_bug(payload, candidates)


@router.post("/bugs/{bug_id}/analyze", response_model=PersistedBugAnalysisResponse)
def analyze_persisted_bug_endpoint(
    bug_id: UUID,
    project_id: UUID,
    _project: Project = Depends(require_project_role()),
    db: Session = Depends(get_db),
) -> PersistedBugAnalysisResponse:
    """Analyze a stored project bug, save the advisory result, and return it."""
    bug = db.scalar(select(Bug).where(
        Bug.id == bug_id,
        Bug.project_id == project_id,
        Bug.is_deleted.is_(False),
    ))
    if bug is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bug not found in this project")

    description = "\n".join(part for part in [bug.title, bug.description or ""] if part).strip()
    payload = AnalyzeBugRequest(title=bug.title, description=description)
    candidates = _candidate_models(_project_bug_rows(db, project_id, exclude_bug_id=bug.id))
    prediction = analyze_bug(payload, candidates)

    analysis = db.scalar(select(BugAIAnalysis).where(BugAIAnalysis.bug_id == bug.id))
    if analysis is None:
        analysis = BugAIAnalysis(bug_id=bug.id)
        db.add(analysis)
    analysis.suggested_title = prediction.suggested_title
    analysis.suggested_category = prediction.category
    analysis.suggested_severity = prediction.severity
    analysis.suggested_priority = prediction.priority
    analysis.duplicate_bug_ids = [item.bug_id for item in prediction.duplicates]
    db.flush()
    db.commit()
    db.refresh(analysis)
    return PersistedBugAnalysisResponse(
        bug_id=bug.id,
        analysis_id=analysis.id,
        analysis=prediction,
    )


@router.post("/evaluate", response_model=EvaluateAIResponse)
def evaluate_ai_endpoint(
    payload: EvaluateAIRequest,
    project_id: UUID,
    _project: Project = Depends(require_project_role(ProjectRole.QA_ENGINEER)),
    db: Session = Depends(get_db),
) -> EvaluateAIResponse:
    """Evaluate live model suggestions against labels and project-scoped bug candidates."""
    return evaluate_labeled_dataset(payload, _candidates_by_case(payload, db, project_id))
