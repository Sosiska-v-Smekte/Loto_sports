from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Comment, Event, EventStatus, User
from app.schemas.events import CommentOut, ReplyTo
from app.services.access import can_manage, get_event_for_viewer
from app.services.errors import bad_request, conflict, not_found
from app.services.notifications import notify_reply

EXCERPT_LENGTH = 120


def _visible_text(comment: Comment, viewer: User | None) -> str | None:
    # Скрытое сообщение остаётся в ленте как заглушка; оригинал видит только администратор
    if comment.is_hidden and not (viewer and viewer.is_admin):
        return None
    return comment.text


def _root_id(comment: Comment, by_id: dict[int, Comment]) -> int:
    current = comment
    while current.parent_id is not None and current.parent_id in by_id:
        current = by_id[current.parent_id]
    return current.id


def present_thread(comments: list[Comment], event: Event, viewer: User | None) -> list[CommentOut]:
    by_id = {c.id: c for c in comments}
    is_admin = bool(viewer and viewer.is_admin)
    result = []
    for comment in comments:
        parent = by_id.get(comment.parent_id) if comment.parent_id else None
        reply_to = None
        if parent is not None:
            parent_text = _visible_text(parent, viewer)
            reply_to = ReplyTo(
                id=parent.id,
                author_name=parent.author.name,
                excerpt=parent_text[:EXCERPT_LENGTH] if parent_text else None,
            )
        result.append(
            CommentOut(
                id=comment.id,
                author=comment.author,
                text=_visible_text(comment, viewer),
                is_hidden=comment.is_hidden,
                hidden_reason=comment.hidden_reason if is_admin else None,
                is_organizer_reply=can_manage(event, comment.author),
                created_at=comment.created_at,
                parent_id=comment.parent_id,
                root_id=_root_id(comment, by_id),
                reply_to=reply_to,
            )
        )
    return result


def _thread(db: Session, event: Event) -> list[Comment]:
    stmt = select(Comment).where(Comment.event_id == event.id).order_by(Comment.created_at, Comment.id)
    return list(db.scalars(stmt))


def _present_one(db: Session, comment: Comment, event: Event, viewer: User | None) -> CommentOut:
    return next(c for c in present_thread(_thread(db, event), event, viewer) if c.id == comment.id)


def list_comments(db: Session, event_id: int, viewer: User | None) -> list[CommentOut]:
    event = get_event_for_viewer(db, event_id, viewer)
    return present_thread(_thread(db, event), event, viewer)


def add_comment(db: Session, event_id: int, author: User, text: str, parent_id: int | None = None) -> CommentOut:
    event = get_event_for_viewer(db, event_id, author)
    if event.status != EventStatus.published:
        raise conflict("Мероприятие снято с публикации, обсуждение закрыто")
    parent = None
    if parent_id is not None:
        parent = db.get(Comment, parent_id)
        # Ответить можно только на сообщение из этого же обсуждения
        if parent is None or parent.event_id != event.id:
            raise bad_request("Сообщение, на которое вы отвечаете, не найдено в этом обсуждении")
    comment = Comment(event_id=event.id, author_id=author.id, text=text, parent_id=parent.id if parent else None)
    db.add(comment)
    if parent is not None:
        db.flush()
        notify_reply(db, event, comment, parent)
    db.commit()
    db.refresh(comment)
    return _present_one(db, comment, event, author)


def hide_comment(db: Session, comment_id: int, admin: User, reason: str) -> CommentOut:
    comment = db.get(Comment, comment_id)
    if comment is None:
        raise not_found("Сообщение не найдено")
    comment.is_hidden = True
    comment.hidden_reason = reason
    db.commit()
    db.refresh(comment)
    return _present_one(db, comment, db.get(Event, comment.event_id), admin)
