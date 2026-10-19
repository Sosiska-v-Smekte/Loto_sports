from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Comment, Event, EventStatus, User
from app.schemas.events import CommentOut
from app.services.access import can_manage, get_event_for_viewer
from app.services.errors import conflict, not_found


def present_comment(comment: Comment, event: Event, viewer: User | None) -> CommentOut:
    is_admin = bool(viewer and viewer.is_admin)
    # Скрытое сообщение остаётся в ленте как заглушка; оригинал и причину видит только администратор
    show_text = not comment.is_hidden or is_admin
    return CommentOut(
        id=comment.id,
        author=comment.author,
        text=comment.text if show_text else None,
        is_hidden=comment.is_hidden,
        hidden_reason=comment.hidden_reason if is_admin else None,
        is_organizer_reply=can_manage(event, comment.author),
        created_at=comment.created_at,
    )


def list_comments(db: Session, event_id: int, viewer: User | None) -> list[CommentOut]:
    event = get_event_for_viewer(db, event_id, viewer)
    comments = db.scalars(select(Comment).where(Comment.event_id == event.id).order_by(Comment.created_at))
    return [present_comment(c, event, viewer) for c in comments]


def add_comment(db: Session, event_id: int, author: User, text: str) -> CommentOut:
    event = get_event_for_viewer(db, event_id, author)
    if event.status != EventStatus.published:
        raise conflict("Мероприятие снято с публикации, обсуждение закрыто")
    comment = Comment(event_id=event.id, author_id=author.id, text=text)
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return present_comment(comment, event, author)


def hide_comment(db: Session, comment_id: int, admin: User, reason: str) -> CommentOut:
    comment = db.get(Comment, comment_id)
    if comment is None:
        raise not_found("Сообщение не найдено")
    comment.is_hidden = True
    comment.hidden_reason = reason
    db.commit()
    db.refresh(comment)
    return present_comment(comment, db.get(Event, comment.event_id), admin)
