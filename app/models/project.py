import enum
import uuid

from sqlalchemy import Boolean, Enum, ForeignKey, String, Text, UniqueConstraint, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ProjectRole(str, enum.Enum):
    QA_ENGINEER = "QA_ENGINEER"
    DEVELOPER = "DEVELOPER"
    STAKEHOLDER = "STAKEHOLDER"


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(150))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, default=True)

    members: Mapped[list["ProjectMember"]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )


class ProjectMember(Base):
    __tablename__ = "project_members"
    __table_args__ = (UniqueConstraint("project_id", "user_id", name="uq_project_user"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    project_role: Mapped[ProjectRole] = mapped_column(Enum(ProjectRole, name="project_role"))
    project_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("projects.id"))
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))

    project: Mapped["Project"] = relationship(back_populates="members")
    user: Mapped["User"] = relationship()