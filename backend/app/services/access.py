"""Правила доступа к мероприятиям для всех сервисов."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Event, EventStatus, Participation, User
from app.services.errors import not_found


def can_manage(event: Event, user: User | None) -> bool:
    """Управлять событием (видеть заявки, принимать/отклонять) может только организатор.

    Для события от имени организации это ещё и её владелец. Администратор заявки участников не рассматривает.
    """
    if user is None:
        return False
    if event.organizer_user_id == user.id:
        return True
    return event.organization is not None and event.organization.owner_id == user.id


def get_event_for_viewer(db: Session, event_id: int, viewer: User | None) -> Event:
    """Событие, которое этот пользователь вправе открыть.

    Снятое с публикации видят организатор, записавшиеся и администратор, удалённое только администратор.
    """
    event = db.get(Event, event_id)
    if event is None:
        raise not_found("Мероприятие не найдено")
    if event.status == EventStatus.published:
        return event
    if viewer is not None and viewer.is_admin:
        return event
    if (
        event.status == EventStatus.unpublished
        and viewer is not None
        and (can_manage(event, viewer) or _has_participation(db, event.id, viewer.id))
    ):
        return event
    raise not_found("Мероприятие недоступно")


def _has_participation(db: Session, event_id: int, user_id: int) -> bool:
    stmt = select(Participation.id).where(Participation.event_id == event_id, Participation.user_id == user_id)
    return db.scalar(stmt) is not None
