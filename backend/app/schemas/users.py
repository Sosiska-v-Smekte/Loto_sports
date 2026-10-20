from typing import Annotated, Literal

from pydantic import BaseModel, Field, StringConstraints, field_validator

from app.schemas.common import City, Email, ORMModel, OrganizationBrief, SportOut
from app.schemas.events import EventOut


class UserOut(ORMModel):
    id: int
    name: str
    email: str
    avatar_url: str | None
    city: str | None
    about: str | None
    is_admin: bool
    notify_new: bool = True
    notify_remind: bool = True
    organization: OrganizationBrief | None

    @field_validator("notify_new", "notify_remind", mode="before")
    @classmethod
    def _default_on(cls, value):
        # У записей, созданных до появления настроек, значения нет — это «включено»
        return True if value is None else value


class UserPublic(ORMModel):
    id: int
    name: str
    avatar_url: str | None
    city: str | None
    about: str | None
    organization: OrganizationBrief | None


class UserSportOut(ORMModel):
    sport: SportOut
    level: str


class UserSportIn(BaseModel):
    sport_id: int
    level: Literal["beginner", "amateur", "pro"] = "amateur"


class UserStats(BaseModel):
    attended: int
    organized: int
    clubs: int


class UserPage(BaseModel):
    user: UserPublic
    events: list[EventOut]
    sports: list[UserSportOut] = Field(default_factory=list)
    stats: UserStats


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
    notify_new: bool | None = None
    notify_remind: bool | None = None


class AvatarIn(BaseModel):
    image: str


class AuthOut(BaseModel):
    token: str
    user: UserOut


class DemoAccount(BaseModel):
    email: str
    password: str
    name: str
    role: str
    description: str
