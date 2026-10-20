from fastapi import APIRouter, status

from app.deps import CurrentUser, Db
from app.schemas.notifications import NotificationOut, UnreadCount
from app.services import notifications as service

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("", response_model=list[NotificationOut])
def list_notifications(db: Db, user: CurrentUser):
    return service.list_for(db, user)


@router.get("/unread-count", response_model=UnreadCount)
def unread_count(db: Db, user: CurrentUser):
    return UnreadCount(count=service.unread_count(db, user))


@router.post("/read-all", status_code=status.HTTP_204_NO_CONTENT)
def read_all(db: Db, user: CurrentUser):
    service.mark_all_read(db, user)


@router.post("/{notification_id}/read", response_model=NotificationOut)
def read(notification_id: int, db: Db, user: CurrentUser):
    return service.mark_read(db, user, notification_id)
