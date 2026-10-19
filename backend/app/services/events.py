from collections import defaultdict
from datetime import date, datetime, time, timedelta

from sqlalchemy import Select, func, or_, select
from sqlalchemy.orm import Session

from app.db import search_key
from app.models import (
    Event,
    EventStatus,
    JoinMode,
    Organization,
    OrganizationStatus,
    Participation,
    ParticipationStatus,
    Sport,
    User,
)
from app.models.base import now
from app.schemas.events import EventCreate, EventOut, MyParticipation
from app.services.access import can_manage
from app.services.errors import bad_request, forbidden, not_found
from app.services.sports import get_or_create_sport


def present_events(db: Session, events: list[Event], viewer: User | None) -> list[EventOut]:
    """Собирает ответ с вычисляемыми полями одним запросом на счётчики и одним на статусы зрителя."""
    if not events:
        return []
    ids = [e.id for e in events]
    counts: dict[int, dict[str, int]] = defaultdict(dict)
    rows = db.execute(
        select(Participation.event_id, Participation.status, func.count())
        .where(Participation.event_id.in_(ids))
        .group_by(Participation.event_id, Participation.status)
    )
    for event_id, status, count in rows:
        counts[event_id][status] = count

    mine: dict[int, Participation] = {}
    if viewer is not None:
        stmt = select(Participation).where(Participation.event_id.in_(ids), Participation.user_id == viewer.id)
        mine = {p.event_id: p for p in db.scalars(stmt)}

    current = now()
    result = []
    for event in events:
        manager = can_manage(event, viewer) or bool(viewer and viewer.is_admin)
        participation = mine.get(event.id)
        result.append(
            EventOut.model_validate(
                {
                    **{c.key: getattr(event, c.key) for c in Event.__table__.columns},
                    "sport": event.sport,
                    "organizer": event.organizer,
                    "organization": event.organization,
                    "participants_count": counts[event.id].get(ParticipationStatus.confirmed, 0),
                    "pending_count": counts[event.id].get(ParticipationStatus.pending, 0) if manager else None,
                    "my_participation": MyParticipation.model_validate(participation) if participation else None,
                    "can_manage": can_manage(event, viewer),
                    "is_past": event.starts_at < current,
                }
            )
        )
    return result


def _feed_query() -> Select[tuple[Event]]:
    """Основная выдача: только опубликованные и ещё не начавшиеся события."""
    return (
        select(Event)
        .where(Event.status == EventStatus.published, Event.starts_at >= now())
        .order_by(Event.starts_at)
    )


def search_events(
    db: Session,
    *,
    query: str | None = None,
    city: str | None = None,
    day: date | None = None,
    sport_id: int | None = None,
) -> list[Event]:
    stmt = _feed_query().join(Event.sport)
    if query:
        needle = search_key(query.strip())
        stmt = stmt.where(
            or_(
                func.search_key(Event.title).contains(needle),
                func.search_key(Event.description).contains(needle),
                func.search_key(Event.address).contains(needle),
                func.search_key(Event.place_details).contains(needle),
                Sport.normalized_name.contains(needle),
            )
        )
    if city:
        stmt = stmt.where(Event.city == city)
    if day:
        start = datetime.combine(day, time.min)
        stmt = stmt.where(Event.starts_at >= start, Event.starts_at < start + timedelta(days=1))
    if sport_id:
        stmt = stmt.where(Event.sport_id == sport_id)
    return list(db.scalars(stmt).unique())


def featured_event(db: Session, city: str | None) -> Event | None:
    """Баннер на главной: ближайшее событие со свободной записью."""
    stmt = _feed_query().where(Event.join_mode == JoinMode.open)
    if city:
        stmt = stmt.where(Event.city == city)
    return db.scalars(stmt.limit(1)).first()


def list_cities(db: Session) -> list[str]:
    stmt = (
        select(Event.city)
        .where(Event.status == EventStatus.published, Event.starts_at >= now())
        .group_by(Event.city)
        .order_by(func.count().desc())
    )
    return list(db.scalars(stmt))


def upcoming_by_organizer(db: Session, user_id: int) -> list[Event]:
    return list(db.scalars(_feed_query().where(Event.organizer_user_id == user_id)).unique())


def upcoming_by_organization(db: Session, organization_id: int) -> list[Event]:
    return list(db.scalars(_feed_query().where(Event.organization_id == organization_id)).unique())


def organized_by(db: Session, user: User) -> list[Event]:
    """«Я организую»: все свои события, кроме удалённых, включая снятые (с причиной)."""
    stmt = (
        select(Event)
        .outerjoin(Event.organization)
        .where(
            or_(Event.organizer_user_id == user.id, Organization.owner_id == user.id),
            Event.status != EventStatus.deleted,
        )
        .order_by(Event.starts_at.desc())
    )
    return list(db.scalars(stmt).unique())


def create_event(db: Session, data: EventCreate, author: User) -> Event:
    if data.starts_at <= now():
        raise bad_request("Дата и время начала должны быть в будущем")

    if data.organization_id is not None:
        organization = db.get(Organization, data.organization_id)
        if organization is None:
            raise not_found("Организация не найдена")
        if organization.owner_id != author.id:
            raise forbidden("Публиковать от имени организации может только её владелец")
        if organization.status != OrganizationStatus.approved:
            raise forbidden("Организация ещё не прошла проверку: публиковать от её имени пока нельзя")

    if data.sport_id is not None:
        sport = db.get(Sport, data.sport_id)
        if sport is None:
            raise bad_request("Направление не найдено")
    else:
        sport = get_or_create_sport(db, data.sport_name or "", author)

    event = Event(
        **data.model_dump(exclude={"sport_id", "sport_name"}),
        sport_id=sport.id,
        organizer_user_id=author.id,
        status=EventStatus.published,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event
