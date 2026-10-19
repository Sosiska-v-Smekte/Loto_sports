from typing import Annotated

from pydantic import BaseModel, ConfigDict, StringConstraints

# Строка без пробелов по краям
Text = Annotated[str, StringConstraints(strip_whitespace=True)]


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class UserBrief(ORMModel):
    id: int
    name: str
    avatar_url: str | None


class SportOut(ORMModel):
    id: int
    name: str
    slug: str | None
    color: str
    icon: str
    is_custom: bool


class OrganizationBrief(ORMModel):
    id: int
    name: str
    status: str


class ReasonIn(BaseModel):
    reason: Annotated[str, StringConstraints(strip_whitespace=True, min_length=3, max_length=500)]
