from collections.abc import Iterator
from pathlib import Path

from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.config import DATABASE_URL


class Base(DeclarativeBase):
    pass


def search_key(value: str | None) -> str | None:
    """Ключ для поиска без учёта регистра и «ё»."""
    return value.lower().replace("ё", "е") if value else value


def make_engine(url: str) -> Engine:
    kwargs = {}
    if url in ("sqlite://", "sqlite:///:memory:"):
        # Одна общая in-memory база на все соединения (для тестов)
        kwargs["poolclass"] = StaticPool
    elif url.startswith("sqlite:///"):
        Path(url.removeprefix("sqlite:///")).parent.mkdir(parents=True, exist_ok=True)
    engine = create_engine(url, connect_args={"check_same_thread": False}, **kwargs)

    @event.listens_for(engine, "connect")
    def _on_connect(dbapi_connection, _record) -> None:
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()
        # Встроенный lower() в SQLite понимает только латиницу, поэтому поиск по-русски идёт через Python
        dbapi_connection.create_function("search_key", 1, search_key, deterministic=True)

    return engine


engine = make_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def init_db(bind: Engine = engine) -> None:
    import app.models  # noqa: F401  регистрирует модели в metadata

    Base.metadata.create_all(bind)


def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
