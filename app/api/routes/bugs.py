import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.bug import Bug, BugStatus, BugStatusHistory
from app.models.project import ProjectMember
from app.models.user import SystemRole, User
from app.schemas.bug import BugHistoryRead, BugRead, BugStatusUpdate
from app.services.notification_service import dispatch_role_notifications

router = APIRouter(prefix="/api/bugs", tags=["Bugs"])


def check_bug_access(bug: Bug, current_user: User, db: Session):
    if current_user.system_role == SystemRole.ADMIN:
        return
    member = db.scalar(
        select(ProjectMember).where(
            ProjectMember.project_id == bug.project_id,
            ProjectMember.user_id == current_user.id,
        )
    )
    if not member:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this bug's project",
        )


@router.get("/{bug_id}", response_model=BugRead)
def get_bug(
    bug_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bug = db.get(Bug, bug_id)
    if not bug or bug.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Bug not found"
        )
    check_bug_access(bug, current_user, db)
    return bug


@router.get("/{bug_id}/history", response_model=list[BugHistoryRead])
def get_bug_history(
    bug_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bug = db.get(Bug, bug_id)
    if not bug or bug.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Bug not found"
        )
    check_bug_access(bug, current_user, db)
    query = (
        select(BugStatusHistory)
        .where(BugStatusHistory.bug_id == bug.id)
        .order_by(BugStatusHistory.changed_at.desc(), BugStatusHistory.id.desc())
    )
    return db.scalars(query).all()


@router.patch("/{bug_id}/status", response_model=BugRead)
def update_bug_status(
    bug_id: uuid.UUID,
    data: BugStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bug = db.get(Bug, bug_id)
    if not bug or bug.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Bug not found"
        )
    check_bug_access(bug, current_user, db)

    try:
        new_status_enum = BugStatus(data.status)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid bug status '{data.status}'",
        )

    old_status = bug.status
    if old_status == new_status_enum:
        return bug

    bug.status = new_status_enum
    bug.updated_at = func.now()

    history = BugStatusHistory(
        bug_id=bug.id,
        old_status=old_status,
        new_status=new_status_enum,
        reason=data.reason or f"Status changed from {old_status.value} to {new_status_enum.value}",
        changed_by=current_user.id,
    )
    db.add(history)

    # Dispatch role-based notifications
    message = f"{current_user.name} moved bug {bug.bug_code} to {new_status_enum.value}"
    specific_users = [bug.assignee_id, bug.reporter_id]
    dispatch_role_notifications(
        db=db,
        project_id=bug.project_id,
        actor=current_user,
        message=message,
        specific_user_ids=specific_users,
    )

    db.commit()
    db.refresh(bug)
    return bug


@router.post("/{bug_id}/revert-status", response_model=BugRead)
def revert_bug_status(
    bug_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    bug = db.get(Bug, bug_id)
    if not bug or bug.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Bug not found"
        )
    check_bug_access(bug, current_user, db)

    # Query chronological history descending
    histories = db.scalars(
        select(BugStatusHistory)
        .where(BugStatusHistory.bug_id == bug.id)
        .order_by(BugStatusHistory.changed_at.desc(), BugStatusHistory.id.desc())
    ).all()

    if not histories:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No status history records found for this bug",
        )

    # Find the target status to revert to:
    # Look at the latest transition's old_status, or preceding distinct status
    target_status: BugStatus | None = None
    for h in histories:
        if h.old_status and h.old_status != bug.status:
            target_status = h.old_status
            break
        elif h.new_status != bug.status:
            target_status = h.new_status
            break

    if not target_status:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No previous status available to revert to",
        )

    current_status = bug.status
    bug.status = target_status
    bug.updated_at = func.now()

    # Record rollback as a NEW history entry without deleting/rewriting prior records
    rollback_history = BugStatusHistory(
        bug_id=bug.id,
        old_status=current_status,
        new_status=target_status,
        reason=f"Reverted status from {current_status.value} back to {target_status.value}",
        changed_by=current_user.id,
    )
    db.add(rollback_history)

    # Dispatch role-based notifications
    message = f"{current_user.name} reverted bug {bug.bug_code} from {current_status.value} back to {target_status.value}"
    specific_users = [bug.assignee_id, bug.reporter_id]
    dispatch_role_notifications(
        db=db,
        project_id=bug.project_id,
        actor=current_user,
        message=message,
        specific_user_ids=specific_users,
    )

    db.commit()
    db.refresh(bug)
    return bug
