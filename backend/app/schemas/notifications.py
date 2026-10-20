from datetime import datetime

from pydantic import BaseModel

from app.schemas.common import ORMModel


class NotificationOut(ORMModel):
    id: int
    type: str
    title: str
    body: str
    link: str
    is_read: bool
    created_at: datetime


class UnreadCount(BaseModel):
    count: int
