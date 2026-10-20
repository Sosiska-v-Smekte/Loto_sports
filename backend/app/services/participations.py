from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Event, EventStatus, JoinMode, Participation, ParticipationStatus, User
from app.models.base import now
from app.schemas.events import ParticipantOut, ParticipantsOut
from app.services.access import can_manage, get_event_for_viewer
from app.services.errors import conflict, forbidden, not_found
from app.services.notifications import notify_decision

_ALREADY = {
    ParticipationStatus.confirmed: "Вы уже записаны на это мероприятие",
    ParticipationStatus.pending: "Ваша заявка уже отправлена и ждёт решения организатора",
    ParticipationStatus.rejected: "Организатор уже отклонил вашу заявку на это мероприятие",
}


def _ensure_capacity(db: Session, event: Event) -> None:
    """У мероприятия в зоне есть предел по людям: сверх вместимости зоны записать нельзя."""
    if event.zone is None:
        return
    taken = db.scalar(
        select(func.count())
        .select_from(Participation)
        .where(Participation.event_id == event.id, Participation.status == ParticipationStatus.confirmed)
    )
    if taken >= event.zone.capacity:
        raise conflict(f"Мест больше нет: {event.zone.name} рассчитан(а) на {event.zone.capacity} чел.")


def join_event(db: Session, event_id: int, user: User) -> Participation:
    """Запись на событие. Все проверки — здесь, даже если кнопку на фронте не показали (прямой запрос к API)."""
    event = db.get(Event, event_id)
    if event is None or event.status == EventStatus.deleted:
        raise not_found("Мероприятие не найдено")
    if event.status == EventStatus.unpublished:
        raise conflict("Мероприятие снято с публикации, записаться на него нельзя")
    if event.starts_at < now():
        raise conflict("Мероприятие уже началось или прошло, запись закрыта")
    if can_manage(event, user):
        raise forbidden("Это ваше мероприятие: организатор не записывается на него как участник")

    existing = db.scalar(
        select(Participation).where(Participation.event_id == event.id, Participation.user_id == user.id)
    )
    if existing is not None:
        raise conflict(_ALREADY[existing.status])

    _ensure_capacity(db, event)

    # Свободная запись сразу делает участником, «по заявке» — только после решения организатора
    is_open = event.join_mode == JoinMode.open
    participation = Participation(
        event_id=event.id,
        user_id=user.id,
        status=ParticipationStatus.confirmed if is_open else ParticipationStatus.pending,
        decided_at=now() if is_open else None,
    )
    db.add(participation)
    db.commit()
    db.refresh(participation)
    return participation


def decide(db: Session, participation_id: int, user: User, approve: bool) -> Participation:
    participation = db.get(Participation, participation_id)
    if participation is None:
        raise not_found("Заявка не найдена")
    event = participation.event
    if not can_manage(event, user):
        raise forbidden("Принимать и отклонять заявки может только организатор мероприятия")
    if event.status == EventStatus.deleted:
        raise not_found("Мероприятие не найдено")
    if participation.status != ParticipationStatus.pending:
        raise conflict("Эта заявка уже рассмотрена")

    if approve:
        _ensure_capacity(db, event)
    participation.status = ParticipationStatus.confirmed if approve else ParticipationStatus.rejected
    participation.decided_at = now()
    notify_decision(db, participation)
    db.commit()
    db.refresh(participation)
    return participation


def list_participants(db: Session, event_id: int, viewer: User | None) -> ParticipantsOut:
    event = get_event_for_viewer(db, event_id, viewer)
    rows = db.scalars(
        select(Participation).where(Participation.event_id == event.id).order_by(Participation.created_at)
    )
    grouped: dict[str, list[ParticipantOut]] = {s.value: [] for s in ParticipationStatus}
    for row in rows:
        grouped[row.status].append(ParticipantOut.model_validate(row))
    if not can_manage(event, viewer):
        return ParticipantsOut(confirmed=grouped[ParticipationStatus.confirmed])
    return ParticipantsOut(**grouped)


def my_participations(db: Session, user: User) -> list[Participation]:
    """Записи пользователя, включая снятые и удалённые события, чтобы он понимал, что произошло.

    Скрытые им самим записи не показываются.
    """
    stmt = (
        select(Participation)
        .join(Participation.event)
        .where(Participation.user_id == user.id, Participation.hidden_by_user.is_(False))
        .order_by(Event.starts_at)
    )
    return list(db.scalars(stmt).unique())


def hide_for_user(db: Session, participation_id: int, user: User) -> None:
    """Убрать неактуальную запись из «Моих активностей»: отклонённую заявку или запись на снятое/удалённое событие."""
    participation = db.get(Participation, participation_id)
    if participation is None or participation.user_id != user.id:
        raise not_found("Запись не найдена")
    is_outdated = (
        participation.status == ParticipationStatus.rejected or participation.event.status != EventStatus.published
    )
    if not is_outdated:
        raise conflict("Активную запись убрать нельзя: вы участвуете или ждёте решения организатора")
    participation.hidden_by_user = True
    db.commit()
