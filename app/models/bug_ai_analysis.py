import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Uuid, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class BugAIAnalysis(Base):
    __tablename__ = "bug_ai_analyses"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    bug_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("bugs.id"), unique=True
    )
    suggested_category: Mapped[str | None] = mapped_column(String(100), nullable=True)
    suggested_severity: Mapped[str | None] = mapped_column(String(50), nullable=True)
    suggested_priority: Mapped[str | None] = mapped_column(String(50), nullable=True)
    suggested_title: Mapped[str | None] = mapped_column(String(300), nullable=True)
    duplicate_bug_ids: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    bug: Mapped["Bug"] = relationship(back_populates="ai_analysis")
