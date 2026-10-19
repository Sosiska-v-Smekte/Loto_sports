from typing import Annotated

from pydantic import BaseModel, StringConstraints

from app.schemas.common import City, Email, ORMModel, OrganizationBrief
from app.schemas.events import EventOut


class UserOut(ORMModel):
    id: int
    name: str
    email: str
    avatar_url: str | None
    city: str | None
    about: str | None
    is_admin: bool
    organization: OrganizationBrief | None


class UserPublic(ORMModel):
    id: int
    name: str
    avatar_url: str | None
    city: str | None
    about: str | None
    organization: OrganizationBrief | None


class UserPage(BaseModel):
    user: UserPublic
    events: list[EventOut]


class LoginIn(BaseModel):
    email: Annotated[str, StringConstraints(strip_whitespace=True, to_lower=True, min_length=3)]
    password: str


class RegisterIn(BaseModel):
    name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=120)]
    email: Email
    password: Annotated[str, StringConstraints(min_length=6, max_length=128)]
    city: City = "Москва"


class ProfileUpdate(BaseModel):
    name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=120)]
    city: City
    about: Annotated[str, StringConstraints(strip_whitespace=True, max_length=500)] = ""


class AuthOut(BaseModel):
    token: str
    user: UserOut


class DemoAccount(BaseModel):
    email: str
    password: str
    name: str
    role: str
    description: str
