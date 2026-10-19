from fastapi import APIRouter

from app.deps import CurrentUser, Db, OptionalUser
from app.schemas.users import ProfileUpdate, UserOut, UserPage
from app.services import users as service
from app.services.events import present_events, upcoming_by_organizer

router = APIRouter(tags=["users"])


@router.get("/users/{user_id}", response_model=UserPage)
def user_page(user_id: int, db: Db, viewer: OptionalUser):
    user, profile = service.public_profile(db, user_id)
    return UserPage(user=profile, events=present_events(db, upcoming_by_organizer(db, user.id), viewer))


@router.patch("/me", response_model=UserOut)
def update_me(data: ProfileUpdate, db: Db, user: CurrentUser):
    return service.update_profile(db, user, data)
