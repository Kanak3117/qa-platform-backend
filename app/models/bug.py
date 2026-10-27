import enum
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Index, String, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class BugSeverity(str, enum.Enum):
    Critical = "Critical"
    High = "High"
    Medium = "Medium"
    Low = "Low"
    Informational = "Informational"


class BugStatus(str, enum.Enum):
    Open = "Open"
    InProgress = "In Progress"
    Fixed = "Fixed"
    Retest = "Retest"
    Closed = "Closed"
    Reopened = "Reopened"


class Bug(Base):
    __tablename__ = "bugs"
    __table_args__ = (
        Index("ix_bugs_project_id", "project_id"),
        Index("ix_bugs_reporter_id", "reporter_id"),
        Index("ix_bugs_assignee_id", "assignee_id"),
        Index("ix_bugs_test_case_id", "test_case_id"),
        Index("ix_bugs_status", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    bug_code: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(300))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(100))
    severity: Mapped[BugSeverity] = mapped_column(
        Enum(BugSeverity, name="bug_severity"), default=BugSeverity.Medium
    )
    priority: Mapped[str] = mapped_column(String(50), default="Medium")
    project_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("projects.id"))
    test_case_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("test_cases.id"), nullable=True
    )
    test_execution_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("test_executions.id"), nullable=True
    )
    assignee_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    reporter_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    due_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[BugStatus] = mapped_column(
        Enum(BugStatus, name="bug_status", values_callable=lambda obj: [e.value for e in obj]),
        default=BugStatus.Open,
    )
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    project: Mapped["Project"] = relationship()
    reporter: Mapped["User"] = relationship(foreign_keys="[Bug.reporter_id]")
    assignee: Mapped["User | None"] = relationship(foreign_keys="[Bug.assignee_id]")
    test_case: Mapped["TestCase | None"] = relationship()
    test_execution: Mapped["TestExecution | None"] = relationship()
    status_history: Mapped[list["BugStatusHistory"]] = relationship(
        back_populates="bug", cascade="all, delete-orphan"
    )
    comments: Mapped[list["Comment"]] = relationship(
        back_populates="bug", cascade="all, delete-orphan"
    )
    attachments: Mapped[list["Attachment"]] = relationship(
        back_populates="bug", cascade="all, delete-orphan"
    )
    ai_analysis: Mapped["BugAIAnalysis | None"] = relationship(
        back_populates="bug", cascade="all, delete-orphan"
    )


class BugStatusHistory(Base):
    __tablename__ = "bug_status_histories"
    __table_args__ = (Index("ix_bug_status_histories_bug_id", "bug_id"),)

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    bug_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("bugs.id"))
    old_status: Mapped[BugStatus | None] = mapped_column(
        Enum(BugStatus, name="bug_status", values_callable=lambda obj: [e.value for e in obj]),
        nullable=True,
    )
    new_status: Mapped[BugStatus] = mapped_column(
        Enum(BugStatus, name="bug_status", values_callable=lambda obj: [e.value for e in obj])
    )
    reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    changed_by: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    changed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    bug: Mapped["Bug"] = relationship(back_populates="status_history")
    changer: Mapped["User"] = relationship()
