from datetime import datetime
from enum import StrEnum

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base
from app.models.base import now


class NotificationType(StrEnum):
    reminder = "reminder"
    reply = "reply"
    participation_decision = "participation_decision"
    organization_review = "organization_review"
    organization_request = "organization_request"
    event_unpublished = "event_unpublished"
    interest_invite = "interest_invite"


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    type: Mapped[NotificationType] = mapped_column(String(40))
    title: Mapped[str] = mapped_column(String(300))
    body: Mapped[str] = mapped_column(Text, default="")
    link: Mapped[str] = mapped_column(String(300), default="")
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now, index=True)
    # Ключ события, ради которого создано уведомление: одно и то же не создаётся дважды
    dedup_key: Mapped[str] = mapped_column(String(200), unique=True)
