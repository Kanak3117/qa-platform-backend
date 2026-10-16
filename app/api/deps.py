import uuid
from collections.abc import Callable

from sqlalchemy import select

from app.models.project import Project, ProjectMember, ProjectRole
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import SystemRole, User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = decode_access_token(token)
        user_id = uuid.UUID(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        raise credentials_error

    user = db.get(User, user_id)
    if user is None or not user.active:
        raise credentials_error
    return user
def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.system_role != SystemRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required"
        )
    return current_user


def get_project_or_404(
    project_id: uuid.UUID, db: Session = Depends(get_db)
) -> Project:
    project = db.get(Project, project_id)
    if project is None or not project.active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Project not found"
        )
    return project


def require_project_role(*allowed: ProjectRole) -> Callable:
    def checker(
        project: Project = Depends(get_project_or_404),
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db),
    ) -> Project:
        if current_user.system_role == SystemRole.ADMIN:
            return project
        member = db.scalar(
            select(ProjectMember).where(
                ProjectMember.project_id == project.id,
                ProjectMember.user_id == current_user.id,
            )
        )
        if member is None or (allowed and member.project_role not in allowed):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this project",
            )
        return project

    return checker