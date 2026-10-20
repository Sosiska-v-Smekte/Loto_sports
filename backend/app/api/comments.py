from fastapi import APIRouter, status

from app.deps import CurrentUser, Db, OptionalUser
from app.schemas.events import CommentIn, CommentOut
from app.services import comments as service

router = APIRouter(prefix="/events/{event_id}/comments", tags=["comments"])


@router.get("", response_model=list[CommentOut])
def list_comments(event_id: int, db: Db, viewer: OptionalUser):
    return service.list_comments(db, event_id, viewer)


@router.post("", response_model=CommentOut, status_code=status.HTTP_201_CREATED)
def add_comment(event_id: int, data: CommentIn, db: Db, user: CurrentUser):
    return service.add_comment(db, event_id, user, data.text, data.parent_id)
