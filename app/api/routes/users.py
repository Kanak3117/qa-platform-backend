import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import require_admin
from app.core.database import get_db
from app.models.user import SystemRole, User
from app.schemas.user import UserRead, UserUpdate

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/", response_model=list[UserRead])
def list_users(
    db: Session = Depends(get_db), admin: User = Depends(require_admin)
):
    return db.scalars(select(User).order_by(User.created_at)).all()


@router.patch("/{user_id}", response_model=UserRead)
def update_user(
    user_id: uuid.UUID,
    data: UserUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin),
):
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    if user.id == admin.id and (
        data.active is False or data.system_role == SystemRole.USER
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot deactivate or demote yourself",
        )
    if data.active is not None:
        user.active = data.active
    if data.system_role is not None:
        user.system_role = data.system_role
    db.commit()
    db.refresh(user)
    return user