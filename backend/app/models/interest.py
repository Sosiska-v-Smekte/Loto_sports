from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.base import now


class DayKind(StrEnum):
    weekday = "weekday"
    weekend = "weekend"


class DayPart(StrEnum):
    morning = "morning"  # до 12:00
    day = "day"  # 12:00–17:59
    evening = "evening"  # с 18:00


class Interest(Base):
    """«Я бы пошёл»: намерение без записи на конкретное мероприятие."""

    __tablename__ = "interests"
    __table_args__ = (UniqueConstraint("user_id", "sport_id", "city", "day_kind", "day_part", name="uq_interest"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    sport_id: Mapped[int] = mapped_column(ForeignKey("sports.id"), index=True)
    city: Mapped[str] = mapped_column(String(120), index=True)
    district: Mapped[str] = mapped_column(String(80), default="")
    day_kind: Mapped[DayKind] = mapped_column(String(20))
    day_part: Mapped[DayPart] = mapped_column(String(20))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)

    sport: Mapped["Sport"] = relationship(lazy="joined")  # noqa: F821
