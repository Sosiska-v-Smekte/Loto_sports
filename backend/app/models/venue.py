from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base
from app.models.base import now


class Venue(Base):
    """Площадка: адрес, на котором есть одна или несколько отдельно бронируемых зон."""

    __tablename__ = "venues"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    city: Mapped[str] = mapped_column(String(120), index=True)
    address: Mapped[str] = mapped_column(String(300))
    latitude: Mapped[float | None] = mapped_column(Float)
    longitude: Mapped[float | None] = mapped_column(Float)
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    organization_id: Mapped[int | None] = mapped_column(ForeignKey("organizations.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=now)

    zones: Mapped[list["Zone"]] = relationship(
        back_populates="venue", lazy="selectin", order_by="Zone.sort_order, Zone.id", cascade="all, delete-orphan"
    )


class Zone(Base):
    """Зона бронируется целиком и принимает одно мероприятие за раз (эксклюзивная модель)."""

    __tablename__ = "zones"

    id: Mapped[int] = mapped_column(primary_key=True)
    venue_id: Mapped[int] = mapped_column(ForeignKey("venues.id"), index=True)
    name: Mapped[str] = mapped_column(String(120))
    # Необязательная группа для показа: «Зал настольного тенниса» → «Стол №1», «Стол №2»
    group_name: Mapped[str | None] = mapped_column(String(120))
    capacity: Mapped[int] = mapped_column(Integer)
    # Время на подготовку и уборку после мероприятия: зона освобождается на это число минут позже
    buffer_minutes: Mapped[int] = mapped_column(Integer, default=0)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    venue: Mapped[Venue] = relationship(back_populates="zones", lazy="joined")
