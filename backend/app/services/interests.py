"""«Я бы пошёл»: человек отмечает, что хотел бы заниматься, не беря на себя организацию.

Намерения со схожими параметрами (направление, город, будни/выходные, время суток) складываются
в спрос. Любой из заинтересованных может организовать встречу, остальным придёт приглашение —
но записываются они сами, автоматически никого не записываем.
"""

from collections import defaultdict
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import DayKind, DayPart, Event, Interest, NotificationType, Sport, User
from app.schemas.interests import DemandGroup, InterestIn
from app.schemas.common import SportOut
from app.services.errors import bad_request, forbidden, not_found
from app.services.notifications import notify

DAY_KIND_LABEL = {DayKind.weekday: "в будни", DayKind.weekend: "в выходные"}
DAY_PART_LABEL = {DayPart.morning: "утром", DayPart.day: "днём", DayPart.evening: "вечером"}


def day_kind_of(moment: datetime) -> DayKind:
    return DayKind.weekend if moment.weekday() >= 5 else DayKind.weekday


def day_part_of(moment: datetime) -> DayPart:
    if moment.hour < 12:
        return DayPart.morning
    return DayPart.day if moment.hour < 18 else DayPart.evening


def add_interests(db: Session, data: InterestIn, user: User) -> list[Interest]:
    if db.get(Sport, data.sport_id) is None:
        raise bad_request("Направление не найдено")
    created = []
    for kind in dict.fromkeys(data.day_kinds):
        for part in dict.fromkeys(data.day_parts):
            existing = db.scalar(
                select(Interest).where(
                    Interest.user_id == user.id,
                    Interest.sport_id == data.sport_id,
                    Interest.city == data.city,
                    Interest.day_kind == kind,
                    Interest.day_part == part,
                )
            )
            if existing is not None:
                existing.district = data.district
                created.append(existing)
                continue
            interest = Interest(
                user_id=user.id,
                sport_id=data.sport_id,
                city=data.city,
                district=data.district,
                day_kind=kind,
                day_part=part,
            )
            db.add(interest)
            created.append(interest)
    db.commit()
    return created


def mine(db: Session, user: User) -> list[Interest]:
    return list(db.scalars(select(Interest).where(Interest.user_id == user.id).order_by(Interest.created_at.desc())))


def remove(db: Session, interest_id: int, user: User) -> None:
    interest = db.get(Interest, interest_id)
    if interest is None:
        raise not_found("Отметка не найдена")
    if interest.user_id != user.id:
        raise forbidden("Это чужая отметка")
    db.delete(interest)
    db.commit()


def demand(db: Session, city: str | None, viewer: User | None) -> list[DemandGroup]:
    stmt = select(Interest)
    if city:
        stmt = stmt.where(Interest.city == city)
    groups: dict[tuple, dict] = defaultdict(lambda: {"users": set(), "districts": defaultdict(int)})
    sports: dict[int, Sport] = {}
    for row in db.scalars(stmt).unique():
        key = (row.sport_id, row.city, row.day_kind, row.day_part)
        groups[key]["users"].add(row.user_id)
        if row.district:
            groups[key]["districts"][row.district.strip().capitalize()] += 1
        sports[row.sport_id] = row.sport
    result = [
        DemandGroup(
            sport=SportOut.model_validate(sports[sport_id]),
            city=group_city,
            day_kind=kind,
            day_part=part,
            count=len(info["users"]),
            mine=viewer is not None and viewer.id in info["users"],
            districts=[d for d, _ in sorted(info["districts"].items(), key=lambda item: -item[1])][:3],
        )
        for (sport_id, group_city, kind, part), info in groups.items()
    ]
    return sorted(result, key=lambda g: (-g.count, g.sport.name))


def notify_interested(db: Session, event: Event) -> None:
    """Приглашает тех, чьё намерение подходит новому мероприятию. Никого не записывает."""
    stmt = select(Interest).where(
        Interest.sport_id == event.sport_id,
        Interest.city == event.city,
        Interest.day_kind == day_kind_of(event.starts_at),
        Interest.day_part == day_part_of(event.starts_at),
        Interest.user_id != event.organizer_user_id,
    )
    for user_id in {row.user_id for row in db.scalars(stmt).unique()}:
        notify(
            db,
            user_id,
            NotificationType.interest_invite,
            f"Появилась встреча, которую вы ждали: {event.title}",
            f"{event.sport.name}, {event.starts_at:%d.%m в %H:%M}. Запишитесь, если подходит.",
            f"/events/{event.id}",
            f"interest:{event.id}:{user_id}",
        )
