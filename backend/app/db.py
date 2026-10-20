from collections.abc import Iterator
from pathlib import Path

from sqlalchemy import create_engine, event, inspect, text
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
    _add_missing_columns(bind)


def _add_missing_columns(bind: Engine) -> None:
    """Миграций в проекте нет: новые необязательные колонки (например, avatar_url у организации) добавляются в уже
    существующую базу сами, чтобы после обновления не нужно было пересоздавать её и терять данные."""
    inspector = inspect(bind)
    with bind.begin() as connection:
        for table in Base.metadata.sorted_tables:
            if not inspector.has_table(table.name):
                continue
            existing = {column["name"] for column in inspector.get_columns(table.name)}
            for column in table.columns:
                if column.name not in existing and column.nullable:
                    ddl = column.type.compile(bind.dialect)
                    connection.execute(text(f'ALTER TABLE "{table.name}" ADD COLUMN "{column.name}" {ddl}'))


def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
