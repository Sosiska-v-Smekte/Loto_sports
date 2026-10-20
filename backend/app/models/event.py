from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, Float, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.base import now


class EventLevel(StrEnum):
    any = "any"
    beginner = "beginner"
    amateur = "amateur"
    pro = "pro"


class JoinMode(StrEnum):
    open = "open"
    approval = "approval"


class EventStatus(StrEnum):
    published = "published"
    unpublished = "unpublished"
    deleted = "deleted"


class Event(Base):
    __tablename__ = "events"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text, default="")
    sport_id: Mapped[int] = mapped_column(ForeignKey("sports.id"), index=True)
    organizer_user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    organization_id: Mapped[int | None] = mapped_column(ForeignKey("organizations.id"), index=True)
    starts_at: Mapped[datetime] = mapped_column(DateTime, index=True)
    ends_at: Mapped[datetime | None] = mapped_column(DateTime)
    city: Mapped[str] = mapped_column(String(120), index=True)
    address: Mapped[str] = mapped_column(String(300))
    place_details: Mapped[str] = mapped_column(Text, default="")
    # Координаты точки на карте. Необязательны: без них мероприятие просто не показывается на карте
    latitude: Mapped[float | None] = mapped_column(Float)
    longitude: Mapped[float | None] = mapped_column(Float)
    level: Mapped[EventLevel] = mapped_column(String(20), default=EventLevel.any)
    requirements: Mapped[str] = mapped_column(Text, default="")
    join_mode: Mapped[JoinMode] = mapped_column(String(20), default=JoinMode.open)
    status: Mapped[EventStatus] = mapped_column(
        String(20), default=EventStatus.published, index=True
    )
    moderation_reason: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)

    sport: Mapped["Sport"] = relationship(lazy="joined")  # noqa: F821
    organizer: Mapped["User"] = relationship(lazy="joined")  # noqa: F821
    organization: Mapped["Organization | None"] = relationship(lazy="joined")  # noqa: F821
