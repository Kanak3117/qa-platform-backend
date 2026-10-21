import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Text, Uuid, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Comment(Base):
    __tablename__ = "comments"
    __table_args__ = (
        Index("ix_comments_bug_id", "bug_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    bug_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("bugs.id"))
    comment: Mapped[str] = mapped_column(Text)
    author_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    bug: Mapped["Bug"] = relationship(back_populates="comments")
    author: Mapped["User"] = relationship()
