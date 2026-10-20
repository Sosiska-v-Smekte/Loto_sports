from collections.abc import Iterator

from sqlalchemy import ColumnElement, create_engine, func, text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import BASE_DIR, DATABASE_URL


class Base(DeclarativeBase):
    pass


def search_key(value: str | None) -> str | None:
    """Ключ поиска без учёта регистра и «ё»."""
    return value.lower().replace("ё", "е") if value else value


def search_column(column: ColumnElement[str]) -> ColumnElement[str]:
    """SQL-аналог search_key для колонки."""
    return func.replace(func.lower(column), "ё", "е")


engine = create_engine(DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def migrate(bind: Engine = engine) -> None:
    """Применяет миграции Alembic до последней версии."""
    from alembic import command
    from alembic.config import Config

    config = Config(str(BASE_DIR / "alembic.ini"))
    config.set_main_option("script_location", str(BASE_DIR / "migrations"))
    with bind.begin() as connection:
        config.attributes["connection"] = connection
        command.upgrade(config, "head")


def reset_schema(bind: Engine = engine) -> None:
    """Удаляет все таблицы вместе с историей миграций."""
    with bind.begin() as connection:
        connection.execute(text("DROP SCHEMA IF EXISTS public CASCADE"))
        connection.execute(text("CREATE SCHEMA public"))


def get_db() -> Iterator[Session]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
