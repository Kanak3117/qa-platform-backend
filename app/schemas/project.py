import uuid

from pydantic import BaseModel, ConfigDict, Field

from app.models.project import ProjectRole


class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=150)
    description: str | None = None


class ProjectUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=150)
    description: str | None = None


class ProjectRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    description: str | None
    active: bool


class MemberUser(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    email: str


class MemberCreate(BaseModel):
    user_id: uuid.UUID
    project_role: ProjectRole


class MemberUpdate(BaseModel):
    project_role: ProjectRole


class MemberRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    project_id: uuid.UUID
    project_role: ProjectRole
    user: MemberUser