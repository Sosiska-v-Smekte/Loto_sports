from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, Field, StringConstraints

from app.schemas.common import City, ORMModel

Name = Annotated[str, StringConstraints(strip_whitespace=True, min_length=2, max_length=120)]


class ZoneIn(BaseModel):
    name: Name
    group_name: Annotated[str, StringConstraints(strip_whitespace=True, max_length=120)] | None = None
    capacity: Annotated[int, Field(ge=1, le=500)]
    buffer_minutes: Annotated[int, Field(ge=0, le=240)] = 0


class VenueIn(BaseModel):
    name: Name
    city: City
    address: Annotated[str, StringConstraints(strip_whitespace=True, min_length=3, max_length=300)]
    zones: Annotated[list[ZoneIn], Field(min_length=1, max_length=40)]


class ZoneOut(ORMModel):
    id: int
    name: str
    group_name: str | None
    capacity: int
    buffer_minutes: int


class VenueOut(ORMModel):
    id: int
    name: str
    city: str
    address: str
    latitude: float | None
    longitude: float | None
    organization_id: int | None
    can_manage: bool = False
    zones: list[ZoneOut]


class EventZone(ORMModel):
    """Зона в карточке мероприятия."""

    id: int
    name: str
    group_name: str | None
    capacity: int
    venue_id: int
    venue_name: str


class Slot(BaseModel):
    starts_at: datetime
    ends_at: datetime


class BusyInterval(BaseModel):
    starts_at: datetime
    ends_at: datetime
    title: str


class Availability(BaseModel):
    free: bool
    message: str | None = None
    suggestion: Slot | None = None
    busy: list[BusyInterval] = Field(default_factory=list)
