from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.db import search_key
from collections import defaultdict

from app.models import (
    Event,
    EventStatus,
    Organization,
    OrganizationMember,
    OrganizationStatus,
    Sport,
    User,
)
from app.models.base import now
from app.schemas.organizations import OrganizationOut
from app.schemas.organizations import OrganizationIn
from app.services import avatars
from app.services.errors import conflict, not_found
from app.services.sports import normalize_sport_name
from app.services.notifications import notify_organization_request


def list_approved(db: Session, query: str | None = None) -> list[Organization]:
    stmt = select(Organization).where(Organization.status == OrganizationStatus.approved).order_by(Organization.name)
    if query:
        needle = search_key(query.strip())
        stmt = stmt.where(
            or_(
                func.search_key(Organization.name).contains(needle),
                func.search_key(Organization.sports).contains(needle),
                func.search_key(Organization.city).contains(needle),
            )
        )
    return list(db.scalars(stmt))


def get_public(db: Session, organization_id: int) -> Organization:
    """Публичная страница есть только у одобренной организации."""
    organization = db.get(Organization, organization_id)
    if organization is None or organization.status != OrganizationStatus.approved:
        raise not_found("Организация не найдена или ещё не прошла проверку")
    return organization


def get_own(db: Session, user: User) -> Organization | None:
    return db.scalar(select(Organization).where(Organization.owner_id == user.id))


def submit(db: Session, user: User, data: OrganizationIn) -> Organization:
    """Создаёт заявку на допуск. После отказа можно исправить данные и отправить заявку повторно."""
    organization = get_own(db, user)
    if organization is not None and organization.status != OrganizationStatus.rejected:
        raise conflict(
            "Заявка уже на рассмотрении"
            if organization.status == OrganizationStatus.pending
            else "У вас уже есть одобренная организация"
        )
    if organization is None:
        organization = Organization(owner_id=user.id)
        db.add(organization)
    for field, value in data.model_dump().items():
        setattr(organization, field, value)
    organization.status = OrganizationStatus.pending
    organization.rejection_reason = None
    organization.reviewed_at = None
    db.flush()
    notify_organization_request(db, organization)
    db.commit()
    db.refresh(organization)
    return organization


def set_avatar(db: Session, user: User, image: str | None) -> Organization:
    """Аватарку сообщества меняет его владелец."""
    organization = get_own(db, user)
    if organization is None:
        raise not_found("У вас пока нет организации")
    url = avatars.save(image) if image else None
    avatars.remove(organization.avatar_url)
    organization.avatar_url = url
    db.commit()
    db.refresh(organization)
    return organization


def present(db: Session, organizations: list[Organization], viewer: User | None) -> list[OrganizationOut]:
    """Карточки сообществ: направление для цвета и иконки, число участников и живых событий, моя роль."""
    if not organizations:
        return []
    ids = [o.id for o in organizations]
    members: dict[int, int] = defaultdict(int)
    for organization_id, count in db.execute(
        select(OrganizationMember.organization_id, func.count())
        .where(OrganizationMember.organization_id.in_(ids))
        .group_by(OrganizationMember.organization_id)
    ):
        members[organization_id] = count
    events: dict[int, int] = defaultdict(int)
    for organization_id, count in db.execute(
        select(Event.organization_id, func.count())
        .where(Event.organization_id.in_(ids), Event.status == EventStatus.published, Event.starts_at >= now())
        .group_by(Event.organization_id)
    ):
        events[organization_id] = count
    mine = set()
    if viewer is not None:
        mine = set(
            db.scalars(
                select(OrganizationMember.organization_id).where(
                    OrganizationMember.organization_id.in_(ids), OrganizationMember.user_id == viewer.id
                )
            )
        )
    catalog = [s for s in db.scalars(select(Sport)) if not s.is_custom]

    result = []
    for organization in organizations:
        text = normalize_sport_name(organization.sports)
        found = sorted(
            ((text.find(sport.normalized_name), sport) for sport in catalog if sport.normalized_name in text),
            key=lambda item: item[0],
        )
        out = OrganizationOut.model_validate(organization)
        out.sport = found[0][1] if found else None  # type: ignore[assignment]
        out.members_count = members[organization.id] + 1  # владелец тоже участник
        out.active_events_count = events[organization.id]
        out.is_owner = viewer is not None and organization.owner_id == viewer.id
        out.is_member = out.is_owner or organization.id in mine
        result.append(out)
    return result


def join(db: Session, organization_id: int, user: User) -> Organization:
    organization = get_public(db, organization_id)
    if organization.owner_id == user.id:
        raise conflict("Это ваше сообщество")
    exists = db.scalar(
        select(OrganizationMember.id).where(
            OrganizationMember.organization_id == organization.id, OrganizationMember.user_id == user.id
        )
    )
    if exists is None:
        db.add(OrganizationMember(organization_id=organization.id, user_id=user.id))
        db.commit()
    return organization


def leave(db: Session, organization_id: int, user: User) -> Organization:
    organization = get_public(db, organization_id)
    row = db.scalar(
        select(OrganizationMember).where(
            OrganizationMember.organization_id == organization.id, OrganizationMember.user_id == user.id
        )
    )
    if row is not None:
        db.delete(row)
        db.commit()
    return organization
