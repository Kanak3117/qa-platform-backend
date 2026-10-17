import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import get_project_or_404, require_admin, require_project_role
from app.core.database import get_db
from app.models.project import Project, ProjectMember
from app.models.user import User
from app.schemas.project import MemberCreate, MemberRead, MemberUpdate

router = APIRouter(
    prefix="/api/projects/{project_id}/members", tags=["Project Members"]
)


def get_member_or_404(
    project: Project, member_id: uuid.UUID, db: Session
) -> ProjectMember:
    member = db.get(ProjectMember, member_id)
    if member is None or member.project_id != project.id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Member not found"
        )
    return member


@router.post("/", response_model=MemberRead, status_code=status.HTTP_201_CREATED)
def add_member(
    data: MemberCreate,
    admin: User = Depends(require_admin),
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    user = db.get(User, data.user_id)
    if user is None or not user.active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    existing = db.scalar(
        select(ProjectMember).where(
            ProjectMember.project_id == project.id,
            ProjectMember.user_id == user.id,
        )
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a member of this project",
        )
    member = ProjectMember(
        project_id=project.id, user_id=user.id, project_role=data.project_role
    )
    db.add(member)
    db.commit()
    db.refresh(member)
    _ = member.user  # session band hone se pehle user load kar lo
    return member


@router.get("/", response_model=list[MemberRead])
def list_members(
    project: Project = Depends(require_project_role()),
    db: Session = Depends(get_db),
):
    query = (
        select(ProjectMember)
        .where(ProjectMember.project_id == project.id)
        .options(selectinload(ProjectMember.user))
    )
    return db.scalars(query).all()


@router.patch("/{member_id}", response_model=MemberRead)
def update_member(
    member_id: uuid.UUID,
    data: MemberUpdate,
    admin: User = Depends(require_admin),
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    member = get_member_or_404(project, member_id, db)
    member.project_role = data.project_role
    db.commit()
    db.refresh(member)
    _ = member.user
    return member


@router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_member(
    member_id: uuid.UUID,
    admin: User = Depends(require_admin),
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    member = get_member_or_404(project, member_id, db)
    db.delete(member)
    db.commit()