from datetime import datetime


def now() -> datetime:
    """Текущее время без часового пояса.

    Все даты хранятся как локальное время сервера в одном часовом поясе,
    поэтому в Docker задаётся TZ=Europe/Moscow.
    """
    return datetime.now().replace(microsecond=0)
