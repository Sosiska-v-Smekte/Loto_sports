from sqlalchemy.orm import Session

from app.models import OrganizationStatus, User
from app.schemas.users import ProfileUpdate, UserPublic
from app.services import avatars
from app.services.errors import not_found


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
    db.commit()
    db.refresh(user)
    return user


def set_avatar(db: Session, user: User, image: str | None) -> User:
    """Загружает новую аватарку или (image=None) убирает текущую."""
    url = avatars.save(image) if image else None
    avatars.remove(user.avatar_url)
    user.avatar_url = url
    db.commit()
    db.refresh(user)
    return user
