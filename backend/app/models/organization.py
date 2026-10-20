from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.base import now


class OrganizationStatus(StrEnum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class Organization(Base):
    __tablename__ = "organizations"

    id: Mapped[int] = mapped_column(primary_key=True)
    # Один пользователь — одна организация
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    name: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text, default="")
    sports: Mapped[str] = mapped_column(String(500), default="")
    city: Mapped[str] = mapped_column(String(120))
    contacts: Mapped[str] = mapped_column(String(500), default="")
    avatar_url: Mapped[str | None] = mapped_column(String(500))
    status: Mapped[OrganizationStatus] = mapped_column(
        String(20), default=OrganizationStatus.pending, index=True
    )
    rejection_reason: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime)

    owner: Mapped["User"] = relationship(back_populates="organization")  # noqa: F821
