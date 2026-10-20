from datetime import datetime
from typing import Annotated

from pydantic import BaseModel, Field, StringConstraints, model_validator

from app.models import EventLevel, JoinMode
from app.schemas.common import City, ORMModel, OrganizationBrief, SportOut, UserBrief

ShortText = Annotated[str, StringConstraints(strip_whitespace=True, max_length=2000)]


class MyParticipation(ORMModel):
    id: int
    status: str


class EventOut(ORMModel):
    id: int
    title: str
    description: str
    sport: SportOut
    organizer: UserBrief
    organization: OrganizationBrief | None
    starts_at: datetime
    ends_at: datetime | None
    city: str
    address: str
    place_details: str
    level: str
    requirements: str
    join_mode: str
    card_color: str | None
    status: str
    # Причина видна только тем, кому показывается снятое событие (организатор, записавшиеся, админ)
    moderation_reason: str | None
    created_at: datetime
    participants_count: int
    # Число ожидающих заявок — только для организатора и админа, остальным null
    pending_count: int | None
    my_participation: MyParticipation | None
    can_manage: bool
    is_past: bool


class EventCreate(BaseModel):
    title: Annotated[str, StringConstraints(strip_whitespace=True, min_length=3, max_length=120)]
    description: ShortText = ""
    sport_id: int | None = None
    sport_name: Annotated[str, StringConstraints(strip_whitespace=True, max_length=60)] | None = None
    starts_at: datetime
    ends_at: datetime | None = None
    city: City
    address: Annotated[str, StringConstraints(strip_whitespace=True, min_length=3, max_length=300)]
    place_details: ShortText = ""
    level: EventLevel = EventLevel.any
    requirements: ShortText = ""
    join_mode: JoinMode = JoinMode.open
    card_color: Annotated[str, StringConstraints(pattern=r"^#[0-9A-Fa-f]{6}$")] | None = None
    organization_id: int | None = None

    @model_validator(mode="after")
    def _check(self) -> "EventCreate":
        if not self.sport_id and not self.sport_name:
            raise ValueError("Выберите направление или впишите своё")
        if self.ends_at and self.ends_at <= self.starts_at:
            raise ValueError("Время окончания должно быть позже начала")
        return self


class ParticipantOut(ORMModel):
    id: int
    status: str
    created_at: datetime
    decided_at: datetime | None
    user: UserBrief


class ParticipantsOut(BaseModel):
    confirmed: list[ParticipantOut]
    # Заявки и отказы видит только организатор; остальным — пустые списки
    pending: list[ParticipantOut] = Field(default_factory=list)
    rejected: list[ParticipantOut] = Field(default_factory=list)


class MyParticipationOut(BaseModel):
    id: int
    status: str
    created_at: datetime
    decided_at: datetime | None
    event: EventOut


class CommentIn(BaseModel):
    text: Annotated[str, StringConstraints(strip_whitespace=True, min_length=1, max_length=2000)]
    parent_id: int | None = None


class ReplyTo(BaseModel):
    """Кому отвечают: имя автора и начало исходного сообщения (null, если оно скрыто)."""

    id: int
    author_name: str
    excerpt: str | None


class CommentOut(BaseModel):
    id: int
    author: UserBrief
    # Для скрытых сообщений текст отдаётся только администратору
    text: str | None
    is_hidden: bool
    hidden_reason: str | None
    is_organizer_reply: bool
    created_at: datetime
    parent_id: int | None
    # Ветка в один уровень: ответы на ответы показываются под тем же исходным сообщением
    root_id: int
    reply_to: ReplyTo | None
