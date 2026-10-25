from app.api.deps import get_current_user
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.models.project import ProjectMember
from app.models.user import User
from app.schemas.user import Token, UserCreate, UserRead, UserSelfUpdate

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(data: UserCreate, db: Session = Depends(get_db)):
    email = data.email.lower()
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    user = User(
        name=data.name,
        email=email,
        password_hash=hash_password(data.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(
    form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):
    user = db.scalar(select(User).where(User.email == form.username.lower()))
    if not user or not verify_password(form.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Account is inactive"
        )
    return Token(access_token=create_access_token(str(user.id)))
@router.get("/me", response_model=UserRead)
def me(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    pm = db.scalar(
        select(ProjectMember).where(ProjectMember.user_id == current_user.id)
    )
    return UserRead(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        system_role=current_user.system_role,
        project_role=pm.project_role.value if pm else None,
        active=current_user.active,
        created_at=current_user.created_at,
    )


@router.patch("/me", response_model=UserRead)
def update_me(
    data: UserSelfUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if data.email is not None:
        new_email = data.email.lower()
        if new_email != current_user.email:
            existing = db.scalar(
                select(User).where(User.email == new_email, User.id != current_user.id)
            )
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered",
                )
            current_user.email = new_email

    if data.name is not None:
        trimmed_name = data.name.strip()
        if not trimmed_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Name cannot be empty",
            )
        current_user.name = trimmed_name

    if data.new_password is not None:
        if not data.current_password:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is required to set a new password",
            )
        if not verify_password(data.current_password, current_user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect",
            )
        current_user.password_hash = hash_password(data.new_password)

    db.commit()
    db.refresh(current_user)

    pm = db.scalar(
        select(ProjectMember).where(ProjectMember.user_id == current_user.id)
    )
    return UserRead(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        system_role=current_user.system_role,
        project_role=pm.project_role.value if pm else None,
        active=current_user.active,
        created_at=current_user.created_at,
    )