import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Index, String, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ExecutionResult(str, enum.Enum):
    Passed = "Passed"
    Failed = "Failed"
    Blocked = "Blocked"


class TestRun(Base):
    __tablename__ = "test_runs"
    __table_args__ = (
        Index("ix_test_runs_project_id", "project_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("projects.id"))
    name: Mapped[str] = mapped_column(String(200))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    project: Mapped["Project"] = relationship()
    executions: Mapped[list["TestExecution"]] = relationship(
        back_populates="test_run", cascade="all, delete-orphan"
    )


class TestExecution(Base):
    __tablename__ = "test_executions"
    __table_args__ = (
        Index("ix_test_executions_test_run_id", "test_run_id"),
        Index("ix_test_executions_test_case_id", "test_case_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    test_run_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("test_runs.id"))
    test_case_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("test_cases.id"))
    result: Mapped[ExecutionResult] = mapped_column(
        Enum(ExecutionResult, name="execution_result"), default=ExecutionResult.Passed
    )
    executed_by: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id"), nullable=False
    )
    executed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    test_run: Mapped["TestRun"] = relationship(back_populates="executions")
    test_case: Mapped["TestCase"] = relationship(back_populates="executions")
    executor: Mapped["User"] = relationship()
