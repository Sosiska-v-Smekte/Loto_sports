from enum import StrEnum

from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class SportLevel(StrEnum):
    beginner = "beginner"
    amateur = "amateur"
    pro = "pro"


class UserSport(Base):
    """Направление и уровень, указанные пользователем о себе."""

    __tablename__ = "user_sports"
    __table_args__ = (UniqueConstraint("user_id", "sport_id", name="uq_user_sport"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    sport_id: Mapped[int] = mapped_column(ForeignKey("sports.id"))
    level: Mapped[SportLevel] = mapped_column(String(20), default=SportLevel.amateur)

    sport: Mapped["Sport"] = relationship(lazy="joined")  # noqa: F821
