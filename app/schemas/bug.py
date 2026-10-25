import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class BugStatusUpdate(BaseModel):
    status: str
    reason: str | None = None


class BugHistoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    bug_id: uuid.UUID
    old_status: str | None = None
    new_status: str
    reason: str | None = None
    changed_by: uuid.UUID
    changed_at: datetime


class BugRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    bug_code: str
    title: str
    description: str | None = None
    category: str
    severity: str
    priority: str
    status: str
    project_id: uuid.UUID
    reporter_id: uuid.UUID
    assignee_id: uuid.UUID | None = None
    created_at: datetime
    updated_at: datetime
