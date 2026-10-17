from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import (
    get_current_user,
    get_project_or_404,
    require_admin,
    require_project_role,
)
from app.core.database import get_db
from app.models.project import Project, ProjectMember
from app.models.user import SystemRole, User
from app.schemas.project import ProjectCreate, ProjectRead, ProjectUpdate

router = APIRouter(prefix="/api/projects", tags=["Projects"])


@router.post("/", response_model=ProjectRead, status_code=status.HTTP_201_CREATED)
def create_project(
    data: ProjectCreate,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    project = Project(name=data.name, description=data.description)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.get("/", response_model=list[ProjectRead])
def list_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = select(Project).where(Project.active.is_(True))
    if current_user.system_role != SystemRole.ADMIN:
        query = query.join(
            ProjectMember, ProjectMember.project_id == Project.id
        ).where(ProjectMember.user_id == current_user.id)
    return db.scalars(query.order_by(Project.name)).all()


@router.get("/{project_id}", response_model=ProjectRead)
def get_project(project: Project = Depends(require_project_role())):
    return project


@router.patch("/{project_id}", response_model=ProjectRead)
def update_project(
    data: ProjectUpdate,
    admin: User = Depends(require_admin),
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    if data.name is not None:
        project.name = data.name
    if data.description is not None:
        project.description = data.description
    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    admin: User = Depends(require_admin),
    project: Project = Depends(get_project_or_404),
    db: Session = Depends(get_db),
):
    project.active = False
    db.commit()