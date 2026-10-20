"""Координаты по адресу из карточки мероприятия.

Используется открытый геокодер OpenStreetMap (Nominatim) — без ключей и оплаты, как и тайлы карты.
Его правила: не больше одного запроса в секунду и понятный User-Agent, поэтому запросы
ограничены по частоте, а результаты кешируются. Если адрес не нашёлся или сеть недоступна,
мероприятие сохраняется без координат и просто не показывается на карте.
"""

import logging
import threading
import time
from functools import lru_cache

import httpx

from app.config import GEOCODER_URL, GEOCODING_ENABLED

log = logging.getLogger(__name__)

USER_AGENT = "SportClubHackathon/1.0 (+https://github.com/Sosiska-v-Smekte/Loto_sports)"
TIMEOUT_SECONDS = 4
MAX_ATTEMPTS = 3

_lock = threading.Lock()
_last_request = 0.0


def candidate_queries(address: str, city: str) -> list[str]:
    """Сначала адрес целиком, затем без уточнений в начале: «Манеж «Запад», ул. Дорохова, 10» → «ул. Дорохова, 10».

    Варианты из одного номера дома («10, Москва») не пробуем — они находят случайное место.
    """
    parts = [part.strip() for part in address.split(",") if part.strip()]
    queries = []
    for start in range(len(parts)):
        rest = parts[start:]
        if len(rest) == 1 and rest[0].replace("/", "").isdigit():
            break
        queries.append(", ".join([*rest, city]))
    return queries[:MAX_ATTEMPTS]


def _search(query: str) -> list[dict]:
    global _last_request
    with _lock:
        # Не чаще одного запроса в секунду на всё приложение
        wait = 1.0 - (time.monotonic() - _last_request)
        if wait > 0:
            time.sleep(wait)
        _last_request = time.monotonic()
    response = httpx.get(
        GEOCODER_URL,
        params={"q": query, "format": "jsonv2", "limit": 1, "countrycodes": "ru"},
        headers={"User-Agent": USER_AGENT, "Accept-Language": "ru"},
        timeout=TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    return response.json()


@lru_cache(maxsize=512)
def geocode(address: str, city: str) -> tuple[float, float] | None:
    if not GEOCODING_ENABLED:
        return None
    for query in candidate_queries(address, city):
        try:
            results = _search(query)
        except (httpx.HTTPError, ValueError) as error:
            log.warning("Геокодер недоступен для %r: %s", query, error)
            return None
        if not results:
            continue
        found = results[0]
        # Защита от совпадения в другом городе: название города должно быть в найденном адресе
        if city.lower().replace("ё", "е") not in found.get("display_name", "").lower().replace("ё", "е"):
            continue
        return round(float(found["lat"]), 6), round(float(found["lon"]), 6)
    return None
