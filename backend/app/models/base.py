from datetime import datetime


def now() -> datetime:
    """Текущее время без часового пояса.

    Все даты в MVP хранятся как локальное «настенное» время сервера (один город — один пояс),
    поэтому в Docker задаётся TZ=Europe/Moscow.
    """
    return datetime.now().replace(microsecond=0)
