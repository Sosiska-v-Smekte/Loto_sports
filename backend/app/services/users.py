from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import (
    Event,
    EventStatus,
    OrganizationMember,
    OrganizationStatus,
    Participation,
    ParticipationStatus,
    Sport,
    User,
    UserSport,
)
from app.models.base import now
from app.schemas.users import ProfileUpdate, UserPublic, UserSportIn, UserStats
from app.services import avatars
from app.services.errors import bad_request, not_found


def public_profile(db: Session, user_id: int) -> tuple[User, UserPublic]:
    user = db.get(User, user_id)
    if user is None:
        raise not_found("Пользователь не найден")
    profile = UserPublic.model_validate(user)
    # Неодобренная организация публично не показывается
    if user.organization is None or user.organization.status != OrganizationStatus.approved:
        profile.organization = None
    return user, profile


def update_profile(db: Session, user: User, data: ProfileUpdate) -> User:
    user.name = data.name
    user.city = data.city
    user.about = data.about or None
    update_notifications(db, user, data)
    db.commit()
    db.refresh(user)
    return user


def set_avatar(db: Session, user: User, image: str | None) -> User:
    """Загружает новую аватарку или при image=None убирает текущую."""
    url = avatars.save(image) if image else None
    avatars.remove(user.avatar_url)
    user.avatar_url = url
    db.commit()
    db.refresh(user)
    return user


def update_notifications(db: Session, user: User, data: ProfileUpdate) -> None:
    if data.notify_new is not None:
        user.notify_new = data.notify_new
    if data.notify_remind is not None:
        user.notify_remind = data.notify_remind


def sports_of(db: Session, user_id: int) -> list[UserSport]:
    return list(db.scalars(select(UserSport).where(UserSport.user_id == user_id).order_by(UserSport.id)))


def set_sports(db: Session, user: User, items: list[UserSportIn]) -> list[UserSport]:
    unique = {item.sport_id: item for item in items}
    found = set(db.scalars(select(Sport.id).where(Sport.id.in_(unique))))
    if found != set(unique):
        raise bad_request("Направление не найдено")
    for row in sports_of(db, user.id):
        db.delete(row)
    db.flush()
    for item in unique.values():
        db.add(UserSport(user_id=user.id, sport_id=item.sport_id, level=item.level))
    db.commit()
    return sports_of(db, user.id)


def stats_of(db: Session, user: User) -> UserStats:
    """Число посещённых и организованных мероприятий и сообществ пользователя."""
    attended = db.scalar(
        select(func.count())
        .select_from(Participation)
        .join(Event, Event.id == Participation.event_id)
        .where(
            Participation.user_id == user.id,
            Participation.status == ParticipationStatus.confirmed,
            Event.status == EventStatus.published,
            Event.starts_at < now(),
        )
    )
    organized = db.scalar(
        select(func.count())
        .select_from(Event)
        .where(Event.organizer_user_id == user.id, Event.status != EventStatus.deleted)
    )
    joined = db.scalar(
        select(func.count()).select_from(OrganizationMember).where(OrganizationMember.user_id == user.id)
    )
    owns = 1 if user.organization is not None and user.organization.status == OrganizationStatus.approved else 0
    return UserStats(attended=attended or 0, organized=organized or 0, clubs=(joined or 0) + owns)
