from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.db import search_key
from app.models import Event, EventStatus, Organization, OrganizationStatus, User
from app.models.base import now
from app.schemas.organizations import AdminOrganizationOut, OrganizationOut
from app.services.errors import conflict, not_found


def list_organizations(db: Session, status: str | None, query: str | None) -> list[AdminOrganizationOut]:
    events_count = (
        select(Event.organization_id, func.count().label("total"))
        .where(Event.status != EventStatus.deleted)
        .group_by(Event.organization_id)
        .subquery()
    )
    stmt = (
        select(Organization, func.coalesce(events_count.c.total, 0))
        .join(Organization.owner)
        .outerjoin(events_count, events_count.c.organization_id == Organization.id)
        .order_by(Organization.created_at.desc())
    )
    if status:
        stmt = stmt.where(Organization.status == status)
    if query:
        needle = search_key(query.strip())
        stmt = stmt.where(
            or_(
                func.search_key(Organization.name).contains(needle),
                func.search_key(User.name).contains(needle),
                func.search_key(User.email).contains(needle),
                func.search_key(Organization.city).contains(needle),
            )
        )
    return [
        AdminOrganizationOut(
            **OrganizationOut.model_validate(organization).model_dump(),
            owner_email=organization.owner.email,
            events_count=total,
        )
        for organization, total in db.execute(stmt)
    ]


def review_organization(db: Session, organization_id: int, approve: bool, reason: str | None) -> Organization:
    organization = db.get(Organization, organization_id)
    if organization is None:
        raise not_found("Организация не найдена")
    if organization.status != OrganizationStatus.pending:
        raise conflict("Эта заявка уже рассмотрена")
    organization.status = OrganizationStatus.approved if approve else OrganizationStatus.rejected
    # Причина отказа сохраняется и показывается владельцу в профиле
    organization.rejection_reason = None if approve else reason
    organization.reviewed_at = now()
    db.commit()
    db.refresh(organization)
    return organization


def list_events(
    db: Session, status: str | None, query: str | None, organization_id: int | None, organizer_id: int | None
) -> list[Event]:
    stmt = select(Event).join(Event.organizer).order_by(Event.starts_at.desc())
    if status:
        stmt = stmt.where(Event.status == status)
    if organization_id:
        stmt = stmt.where(Event.organization_id == organization_id)
    if organizer_id:
        stmt = stmt.where(Event.organizer_user_id == organizer_id)
    if query:
        needle = search_key(query.strip())
        stmt = stmt.where(
            or_(
                func.search_key(Event.title).contains(needle),
                func.search_key(Event.address).contains(needle),
                func.search_key(Event.city).contains(needle),
                func.search_key(User.name).contains(needle),
            )
        )
    return list(db.scalars(stmt).unique())


def moderate_event(db: Session, event_id: int, new_status: EventStatus, reason: str) -> Event:
    """Снятие или мягкое удаление. Записи участников не трогаем — они видят статус «Мероприятие снято»."""
    event = db.get(Event, event_id)
    if event is None:
        raise not_found("Мероприятие не найдено")
    if event.status == EventStatus.deleted:
        raise conflict("Мероприятие уже удалено")
    if event.status == new_status:
        raise conflict("Мероприятие уже снято с публикации")
    event.status = new_status
    event.moderation_reason = reason
    db.commit()
    db.refresh(event)
    return event
