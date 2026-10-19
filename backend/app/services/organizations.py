from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.db import search_key
from app.models import Organization, OrganizationStatus, User
from app.schemas.organizations import OrganizationIn
from app.services.errors import conflict, not_found


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
    db.commit()
    db.refresh(organization)
    return organization
