import re
import zlib

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Sport, User
from app.services.errors import bad_request

# Пастельная палитра шапок карточек (снята с макета + дополнительные оттенки)
PALETTE = ["#F6D46A", "#F2A9C8", "#AFC3EE", "#C3D69A", "#F5BE92", "#CDB8EE", "#A9D8C6", "#E9CF9F"]
CUSTOM_SPORT_ICON = "🏅"

BASE_SPORTS = [
    # name, slug, color, icon
    ("Футбол", "football", "#F6D46A", "⚽"),
    ("Баскетбол", "basketball", "#C3D69A", "🏀"),
    ("Волейбол", "volleyball", "#F5BE92", "🏐"),
    ("Теннис", "tennis", "#F2A9C8", "🎾"),
    ("Настольный теннис", "table-tennis", "#A9D8C6", "🏓"),
    ("Шахматы", "chess", "#AFC3EE", "♟️"),
    ("Бег", "running", "#C3D69A", "👟"),
    ("Йога и зарядка", "yoga", "#CDB8EE", "🧘"),
    ("Плавание", "swimming", "#AFC3EE", "🏊"),
    ("Велоспорт", "cycling", "#E9CF9F", "🚴"),
    ("Боулинг", "bowling", "#F5BE92", "🎳"),
    ("Бокс", "boxing", "#F2A9C8", "🥊"),
    ("Хоккей", "hockey", "#AFC3EE", "🏒"),
    ("Бадминтон", "badminton", "#A9D8C6", "🏸"),
]


def normalize_sport_name(name: str) -> str:
    """Ключ сравнения направлений: без лишних пробелов, в нижнем регистре, «ё» как «е»."""
    return re.sub(r"\s+", " ", name).strip().lower().replace("ё", "е")


def display_sport_name(name: str) -> str:
    cleaned = re.sub(r"\s+", " ", name).strip()
    return cleaned[:1].upper() + cleaned[1:]


def color_for(normalized_name: str) -> str:
    # crc32 стабилен между запусками (в отличие от hash()), поэтому цвет не «прыгает»
    return PALETTE[zlib.crc32(normalized_name.encode()) % len(PALETTE)]


def list_sports(db: Session, query: str | None = None) -> list[Sport]:
    stmt = select(Sport).order_by(Sport.is_custom, Sport.id)
    if query:
        stmt = stmt.where(Sport.normalized_name.contains(normalize_sport_name(query)))
    return list(db.scalars(stmt))


def get_or_create_sport(db: Session, name: str, author: User | None) -> Sport:
    """Переиспользует существующее направление с тем же нормализованным названием, иначе создаёт новое."""
    normalized = normalize_sport_name(name)
    if len(normalized) < 2:
        raise bad_request("Название направления слишком короткое")
    if len(normalized) > 60:
        raise bad_request("Название направления должно быть не длиннее 60 символов")
    existing = db.scalar(select(Sport).where(Sport.normalized_name == normalized))
    if existing:
        return existing
    sport = Sport(
        name=display_sport_name(name),
        normalized_name=normalized,
        color=color_for(normalized),
        icon=CUSTOM_SPORT_ICON,
        is_custom=True,
        created_by=author.id if author else None,
    )
    db.add(sport)
    db.flush()
    return sport


def ensure_base_sports(db: Session) -> None:
    for name, slug, color, icon in BASE_SPORTS:
        normalized = normalize_sport_name(name)
        existing = db.scalar(select(Sport).where(Sport.normalized_name == normalized))
        if not existing:
            db.add(Sport(name=name, normalized_name=normalized, slug=slug, color=color, icon=icon))
        elif existing.slug is None:
            # Пользователь уже завёл такое направление сам — теперь оно базовое, со своей иконкой
            existing.slug, existing.icon, existing.is_custom = slug, icon, False
    db.flush()
