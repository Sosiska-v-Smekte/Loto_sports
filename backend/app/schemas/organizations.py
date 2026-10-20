from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, StringConstraints

from app.schemas.common import City, ORMModel, SportOut, UserBrief
from app.schemas.events import EventOut


class OrganizationOut(ORMModel):
    id: int
    owner: UserBrief
    name: str
    description: str
    sports: str
    city: str
    contacts: str
    avatar_url: str | None
    status: str
    rejection_reason: str | None
    created_at: datetime
    reviewed_at: datetime | None
    # Вычисляются только для списка сообществ
    sport: SportOut | None = None
    members_count: int = 0
    active_events_count: int = 0
    is_member: bool = False
    is_owner: bool = False


class OrganizationPage(BaseModel):
    organization: OrganizationOut
    events: list[EventOut]


class AdminOrganizationOut(OrganizationOut):
    owner_email: str
    events_count: int


class OrganizationIn(BaseModel):
    name: Annotated[str, StringConstraints(strip_whitespace=True, min_length=3, max_length=200)]
    description: Annotated[str, StringConstraints(strip_whitespace=True, min_length=10, max_length=2000)]
    sports: Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=500)]
    city: City
    contacts: Annotated[str, StringConstraints(strip_whitespace=True, min_length=3, max_length=500)]
