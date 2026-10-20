"""Справочник городов: единственный источник допустимых значений поля «город»."""

import json
from functools import cache
from pathlib import Path

_DATA = Path(__file__).resolve().parent.parent / "data"
_FILE = _DATA / "cities.json"
# Центры городов для карты: найдены геокодером OpenStreetMap (Nominatim) один раз и хранятся рядом со справочником
_CENTERS_FILE = _DATA / "city_centers.json"


def _key(name: str) -> str:
    return " ".join(name.split()).lower().replace("ё", "е")


@cache
def all_cities() -> tuple[str, ...]:
    return tuple(json.loads(_FILE.read_text(encoding="utf-8")))


@cache
def city_centers() -> dict[str, tuple[float, float]]:
    """Координаты центра каждого города справочника: [широта, долгота]."""
    return {name: (lat, lng) for name, (lat, lng) in json.loads(_CENTERS_FILE.read_text(encoding="utf-8")).items()}


@cache
def _by_key() -> dict[str, str]:
    return {_key(city): city for city in all_cities()}


def check_city(name: str) -> str:
    """Возвращает название города в каноническом виде («орел» → «Орёл») или отклоняет неизвестный город."""
    city = _by_key().get(_key(name))
    if city is None:
        raise ValueError("Выберите город из списка")
    return city
