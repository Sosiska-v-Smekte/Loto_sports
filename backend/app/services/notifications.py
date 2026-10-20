"""Уведомления внутри приложения.

Создаются в сервисном слое в момент события (решение по заявке, ответ, модерация).
Напоминания о скором начале создаются лениво — при запросе списка или счётчика,
поэтому фоновые задачи не нужны. Повторы исключает уникальный dedup_key.
"""

from datetime import datetime, timedelta

from sqlalchemy import func, or_, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models import (
    Comment,
    Event,
    EventStatus,
    Notification,
    NotificationType,
    Organization,
    OrganizationStatus,
    Participation,
    ParticipationStatus,
    User,
)
from app.models.base import now
from app.services.errors import not_found

REMINDER_WINDOW = timedelta(hours=24)
EXCERPT_LENGTH = 80


def already_sent(db: Session, dedup_key: str) -> bool:
    if any(isinstance(o, Notification) and o.dedup_key == dedup_key for o in db.new):
        return True
    return db.scalar(select(Notification.id).where(Notification.dedup_key == dedup_key)) is not None


def notify(
    db: Session,
    user_id: int,
    type_: NotificationType,
    title: str,
    body: str,
    link: str,
    dedup_key: str,
    created_at: datetime | None = None,
) -> bool:
    """Добавляет уведомление в текущую транзакцию, если такого ещё нет. Коммит делает вызывающий сервис."""
    if already_sent(db, dedup_key):
        return False
    db.add(
        Notification(
            user_id=user_id,
            type=type_,
            title=title,
            body=body,
            link=link,
            dedup_key=dedup_key,
            created_at=created_at or now(),
        )
    )
    return True


def _excerpt(text: str) -> str:
    return text if len(text) <= EXCERPT_LENGTH else text[: EXCERPT_LENGTH - 1].rstrip() + "…"


def _when(moment: datetime) -> str:
    days = (moment.date() - now().date()).days
    day = "сегодня" if days == 0 else "завтра" if days == 1 else moment.strftime("%d.%m")
    return f"{day} в {moment:%H:%M}"


# ---------- Поводы для уведомлений ----------


def notify_decision(db: Session, participation: Participation) -> None:
    approved = participation.status == ParticipationStatus.confirmed
    event = participation.event
    notify(
        db,
        participation.user_id,
        NotificationType.participation_decision,
        "Вашу заявку приняли" if approved else "Заявку отклонили",
        f"«{event.title}», {_when(event.starts_at)}" if approved else f"«{event.title}»",
        f"/events/{event.id}",
        f"decision:{participation.id}",
    )


def notify_reply(db: Session, event: Event, reply: Comment, parent: Comment) -> None:
    # Свой же ответ на своё сообщение уведомлением не считается
    if parent.author_id == reply.author_id:
        return
    notify(
        db,
        parent.author_id,
        NotificationType.reply,
        "Вам ответили",
        f"{reply.author.name}: «{_excerpt(reply.text)}» — «{event.title}»",
        f"/events/{event.id}#discussion",
        f"reply:{reply.id}",
        created_at=reply.created_at,
    )


def _moment_key() -> str:
    # Каждая отправка заявки и каждое решение по ней — отдельный повод: ключ с точностью до микросекунд,
    # иначе отказ и одобрение в одну секунду «склеились» бы в одно уведомление
    return datetime.now().isoformat()


def notify_organization_request(db: Session, organization: Organization) -> None:
    submitted = _moment_key()
    for admin_id in db.scalars(select(User.id).where(User.is_admin.is_(True))):
        notify(
            db,
            admin_id,
            NotificationType.organization_request,
            "Новая заявка организации",
            f"«{organization.name}» от {organization.owner.name}",
            "/admin",
            f"org-request:{organization.id}:{admin_id}:{submitted}",
        )


def notify_organization_review(db: Session, organization: Organization) -> None:
    approved = organization.status == OrganizationStatus.approved
    notify(
        db,
        organization.owner_id,
        NotificationType.organization_review,
        "Организация одобрена" if approved else "Заявку организации отклонили",
        f"«{organization.name}» может публиковать мероприятия"
        if approved
        else f"Причина: {organization.rejection_reason}",
        "/communities",
        f"org-review:{organization.id}:{organization.status}:{_moment_key()}",
        created_at=organization.reviewed_at,
    )


def notify_event_unpublished(db: Session, event: Event) -> None:
    """Всем, кто записан или ждёт решения по заявке, сообщаем причину снятия."""
    stmt = select(Participation.user_id).where(
        Participation.event_id == event.id,
        Participation.status.in_([ParticipationStatus.confirmed, ParticipationStatus.pending]),
    )
    for user_id in db.scalars(stmt):
        notify(
            db,
            user_id,
            NotificationType.event_unpublished,
            f"Мероприятие снято: {event.moderation_reason}",
            f"«{event.title}»",
            f"/events/{event.id}",
            f"unpublished:{event.id}:{user_id}",
        )


def ensure_reminders(db: Session, user: User) -> None:
    """Напоминания о событиях, до начала которых меньше суток: участникам и организатору."""
    if not user.notify_remind:
        return
    current = now()
    stmt = (
        select(Event)
        .outerjoin(Event.organization)
        .outerjoin(
            Participation,
            (Participation.event_id == Event.id)
            & (Participation.user_id == user.id)
            & (Participation.status == ParticipationStatus.confirmed),
        )
        .where(
            Event.status == EventStatus.published,
            Event.starts_at > current,
            Event.starts_at <= current + REMINDER_WINDOW,
            or_(
                Participation.id.is_not(None),
                Event.organizer_user_id == user.id,
                Organization.owner_id == user.id,
            ),
        )
    )
    created = [
        notify(
            db,
            user.id,
            NotificationType.reminder,
            "Скоро мероприятие",
            f"«{event.title}» — {_when(event.starts_at)}, {event.address.split(',')[0]}",
            f"/events/{event.id}",
            f"reminder:{event.id}:{user.id}",
        )
        for event in db.scalars(stmt).unique()
    ]
    if any(created):
        try:
            db.commit()
        except IntegrityError:
            # Список и счётчик запрашиваются параллельно: то же напоминание уже создал соседний запрос
            db.rollback()


# ---------- Чтение ----------


def list_for(db: Session, user: User, limit: int = 50) -> list[Notification]:
    ensure_reminders(db, user)
    stmt = (
        select(Notification)
        .where(Notification.user_id == user.id)
        .order_by(Notification.created_at.desc(), Notification.id.desc())
        .limit(limit)
    )
    return list(db.scalars(stmt))


def unread_count(db: Session, user: User) -> int:
    ensure_reminders(db, user)
    stmt = select(func.count()).where(Notification.user_id == user.id, Notification.is_read.is_(False))
    return db.scalar(stmt) or 0


def mark_read(db: Session, user: User, notification_id: int) -> Notification:
    notification = db.get(Notification, notification_id)
    if notification is None or notification.user_id != user.id:
        raise not_found("Уведомление не найдено")
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification


def mark_all_read(db: Session, user: User) -> None:
    db.execute(update(Notification).where(Notification.user_id == user.id).values(is_read=True))
    db.commit()
