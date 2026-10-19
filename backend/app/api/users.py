from fastapi import APIRouter

from app.deps import Db, OptionalUser
from app.models import OrganizationStatus, User
from app.schemas.users import UserPage, UserPublic
from app.services.errors import not_found
from app.services.events import present_events, upcoming_by_organizer

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/{user_id}", response_model=UserPage)
def user_page(user_id: int, db: Db, viewer: OptionalUser):
    user = db.get(User, user_id)
    if user is None:
        raise not_found("Пользователь не найден")
    profile = UserPublic.model_validate(user)
    # Неодобренная организация публично не показывается
    if user.organization is None or user.organization.status != OrganizationStatus.approved:
        profile.organization = None
    return UserPage(user=profile, events=present_events(db, upcoming_by_organizer(db, user.id), viewer))
