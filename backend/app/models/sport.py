from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db import Base


class Sport(Base):
    __tablename__ = "sports"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    # Ключ поиска дублей: «Скандинавская Ходьба » и «скандинавская ходьба» считаются одним направлением
    normalized_name: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    slug: Mapped[str | None] = mapped_column(String(60))
    color: Mapped[str] = mapped_column(String(9))
    icon: Mapped[str] = mapped_column(String(16))
    is_custom: Mapped[bool] = mapped_column(Boolean, default=False)
    created_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"))
