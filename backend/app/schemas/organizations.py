from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, StringConstraints

from app.schemas.common import ORMModel, UserBrief
from app.schemas.events import EventOut


class OrganizationOut(ORMModel):
    id: int
    owner: UserBrief
    name: str
    description: str
    sports: str
    city: str
    contacts: str
    status: str
    rejection_reason: str | None
    created_at: datetime
    reviewed_at: datetime | None


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
    city: Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=120)]
    contacts: Annotated[str, StringConstraints(strip_whitespace=True, min_length=3, max_length=500)]
