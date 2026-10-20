"""Площадки и зоны. Зона принимает одно мероприятие за раз: пересечение по времени — конфликт.

Вместимость и занятость — разные ограничения: вместимость ограничивает число участников,
занятость не пускает вторую группу в зону, уже выделенную первой, сколько бы человек ни записалось.
"""

from datetime import datetime, time, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Event, EventStatus, Organization, OrganizationStatus, User, Venue, Zone
from app.schemas.venues import Availability, BusyInterval, Slot, VenueIn, ZoneIn
from app.services.errors import bad_request, conflict, forbidden, not_found
from app.services.geocoding import geocode


def list_venues(db: Session, city: str | None = None) -> list[Venue]:
    stmt = select(Venue).order_by(Venue.name)
    if city:
        stmt = stmt.where(Venue.city == city)
    return list(db.scalars(stmt))


def get_venue(db: Session, venue_id: int) -> Venue:
    venue = db.get(Venue, venue_id)
    if venue is None:
        raise not_found("Площадка не найдена")
    return venue


def get_zone(db: Session, zone_id: int) -> Zone:
    zone = db.get(Zone, zone_id)
    if zone is None:
        raise not_found("Зона не найдена")
    return zone


def can_manage_venue(venue: Venue, user: User | None) -> bool:
    return user is not None and (user.is_admin or venue.owner_id == user.id)


def _add_zone(venue: Venue, data: ZoneIn, order: int) -> None:
    venue.zones.append(
        Zone(
            name=data.name,
            group_name=data.group_name or None,
            capacity=data.capacity,
            buffer_minutes=data.buffer_minutes,
            sort_order=order,
        )
    )


def create_venue(db: Session, data: VenueIn, user: User) -> Venue:
    organization = db.scalar(select(Organization).where(Organization.owner_id == user.id))
    approved = organization is not None and organization.status == OrganizationStatus.approved
    if not (approved or user.is_admin):
        raise forbidden("Добавлять площадки могут организации, прошедшие проверку")
    venue = Venue(
        name=data.name,
        city=data.city,
        address=data.address,
        owner_id=user.id,
        organization_id=organization.id if approved else None,
    )
    point = geocode(data.address, data.city)
    if point is not None:
        venue.latitude, venue.longitude = point
    for order, zone in enumerate(data.zones):
        _add_zone(venue, zone, order)
    db.add(venue)
    db.commit()
    db.refresh(venue)
    return venue


def add_zone(db: Session, venue_id: int, data: ZoneIn, user: User) -> Venue:
    venue = get_venue(db, venue_id)
    if not can_manage_venue(venue, user):
        raise forbidden("Менять площадку может только её владелец")
    _add_zone(venue, data, len(venue.zones))
    db.commit()
    db.refresh(venue)
    return venue


def remove_zone(db: Session, zone_id: int, user: User) -> Venue:
    zone = get_zone(db, zone_id)
    venue = zone.venue
    if not can_manage_venue(venue, user):
        raise forbidden("Менять площадку может только её владелец")
    if db.scalar(select(Event.id).where(Event.zone_id == zone.id).limit(1)) is not None:
        raise conflict("В этой зоне уже есть мероприятия, удалить её нельзя")
    if len(venue.zones) == 1:
        raise bad_request("У площадки должна остаться хотя бы одна зона")
    venue.zones.remove(zone)
    db.commit()
    db.refresh(venue)
    return venue


def _busy(db: Session, zone: Zone, after: datetime, before: datetime | None = None) -> list[tuple[datetime, datetime, str]]:
    """Занятые интервалы зоны с учётом буфера. Снятые и удалённые мероприятия зону не держат."""
    buffer = timedelta(minutes=zone.buffer_minutes)
    stmt = (
        select(Event)
        .where(Event.zone_id == zone.id, Event.status == EventStatus.published, Event.ends_at.is_not(None))
        .order_by(Event.starts_at)
    )
    result = []
    for event in db.scalars(stmt).unique():
        end = event.ends_at + buffer
        if end <= after or (before is not None and event.starts_at >= before):
            continue
        result.append((event.starts_at, end, event.title))
    return result


def _clock(moment: datetime, reference: datetime) -> str:
    text = moment.strftime("%H:%M")
    return text if moment.date() == reference.date() else f"{moment.strftime('%d.%m')} {text}"


def availability(db: Session, zone: Zone, starts_at: datetime, ends_at: datetime) -> Availability:
    if ends_at <= starts_at:
        raise bad_request("Время окончания должно быть позже начала")
    buffer = timedelta(minutes=zone.buffer_minutes)
    duration = ends_at - starts_at
    day_start = datetime.combine(starts_at.date(), time.min)
    day = [
        BusyInterval(starts_at=s, ends_at=e - buffer, title=t)
        for s, e, t in _busy(db, zone, day_start, day_start + timedelta(days=1))
    ]
    clash = [b for b in _busy(db, zone, starts_at) if b[0] < ends_at + buffer and starts_at < b[1]]
    if not clash:
        return Availability(free=True, busy=day)

    first = clash[0]
    # Ближайшее окно подходящей длины после запрошенного начала
    moment = starts_at
    for busy_start, busy_end, _title in _busy(db, zone, starts_at):
        if moment + duration + buffer <= busy_start:
            break
        moment = max(moment, busy_end)
    message = (
        f"{zone.name}: занято с {_clock(first[0], starts_at)} до {_clock(first[1], starts_at)}"
        f" («{first[2]}»). Выберите другое время или площадку. "
        f"Ближайшее свободное время: {_clock(moment, starts_at)}–{_clock(moment + duration, starts_at)}."
    )
    return Availability(free=False, message=message, suggestion=Slot(starts_at=moment, ends_at=moment + duration), busy=day)


def ensure_free(db: Session, zone: Zone, starts_at: datetime, ends_at: datetime) -> None:
    result = availability(db, zone, starts_at, ends_at)
    if not result.free:
        raise conflict(result.message or "Зона в это время занята")
