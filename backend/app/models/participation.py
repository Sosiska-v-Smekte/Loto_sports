from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.base import now


class ParticipationStatus(StrEnum):
    confirmed = "confirmed"
    pending = "pending"
    rejected = "rejected"


class Participation(Base):
    __tablename__ = "participations"
    __table_args__ = (UniqueConstraint("event_id", "user_id", name="uq_participation_event_user"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    event_id: Mapped[int] = mapped_column(ForeignKey("events.id"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    status: Mapped[ParticipationStatus] = mapped_column(String(20))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)
    decided_at: Mapped[datetime | None] = mapped_column(DateTime)

    event: Mapped["Event"] = relationship(lazy="joined")  # noqa: F821
    user: Mapped["User"] = relationship(lazy="joined")  # noqa: F821
