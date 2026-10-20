from datetime import datetime
from enum import StrEnum

from sqlalchemy import Boolean, DateTime, ForeignKey, String, UniqueConstraint
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
    # Скрытие убирает запись только из списка самого пользователя. Строка не удаляется, чтобы отклонённый
    # не мог подать заявку повторно, а у организатора и администратора сохранялась история заявок.
    hidden_by_user: Mapped[bool] = mapped_column(Boolean, default=False)

    event: Mapped["Event"] = relationship(lazy="joined")  # noqa: F821
    user: Mapped["User"] = relationship(lazy="joined")  # noqa: F821
