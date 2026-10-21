import uuid

from sqlalchemy import Boolean, ForeignKey, Index, String, Text, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class TestSuite(Base):
    __tablename__ = "test_suites"
    __table_args__ = (
        Index("ix_test_suites_project_id", "project_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    project_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("projects.id"))
    name: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    project: Mapped["Project"] = relationship()
    test_cases: Mapped[list["TestCase"]] = relationship(
        back_populates="test_suite", cascade="all, delete-orphan"
    )


class TestCase(Base):
    __tablename__ = "test_cases"
    __table_args__ = (
        Index("ix_test_cases_test_suite_id", "test_suite_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    test_suite_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("test_suites.id"))
    title: Mapped[str] = mapped_column(String(300))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    steps: Mapped[str | None] = mapped_column(Text, nullable=True)
    expected_result: Mapped[str | None] = mapped_column(Text, nullable=True)
    priority: Mapped[str] = mapped_column(String(50), default="Medium")
    status: Mapped[str] = mapped_column(String(50), default="Draft")
    is_deleted: Mapped[bool] = mapped_column(Boolean, default=False)

    test_suite: Mapped["TestSuite"] = relationship(back_populates="test_cases")
    executions: Mapped[list["TestExecution"]] = relationship(back_populates="test_case")
