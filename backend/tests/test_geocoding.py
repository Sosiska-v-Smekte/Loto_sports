"""Точка на карте по адресу из карточки: сетевой запрос к геокодеру подменяется."""

import pytest

from app.services import geocoding
from tests.conftest import event_payload


@pytest.fixture
def fake_geocoder(monkeypatch):
    """Геокодер «знает» только улицу Генерала Дорохова в Москве и остров Татышев в Красноярске."""
    calls: list[str] = []
    known = {
        "ул. Генерала Дорохова, 10, Москва": {"lat": "55.70235", "lon": "37.440067", "display_name": "10, улица Генерала Дорохова, Москва"},
        "Остров Татышев, Красноярск": {"lat": "56.028895", "lon": "92.945143", "display_name": "Остров Татышев, Красноярск"},
        "Ленина, 1, Красноярск": {"lat": "55.75", "lon": "37.61", "display_name": "улица Ленина, 1, Москва"},
    }

    def search(query: str) -> list[dict]:
        calls.append(query)
        return [known[query]] if query in known else []

    monkeypatch.setattr(geocoding, "GEOCODING_ENABLED", True)
    monkeypatch.setattr(geocoding, "_search", search)
    geocoding.geocode.cache_clear()
    yield calls
    geocoding.geocode.cache_clear()


def test_candidates_drop_leading_details():
    assert geocoding.candidate_queries("Манеж «Запад», ул. Генерала Дорохова, 10", "Москва") == [
        "Манеж «Запад», ул. Генерала Дорохова, 10, Москва",
        "ул. Генерала Дорохова, 10, Москва",
    ]


def test_event_point_is_placed_by_card_address(client, login, fake_geocoder):
    created = client.post(
        "/api/events",
        headers=login("user@demo.ru"),
        json=event_payload(address="Манеж «Запад», ул. Генерала Дорохова, 10", city="Москва"),
    ).json()
    assert (created["latitude"], created["longitude"]) == (55.70235, 37.440067)
    assert fake_geocoder == ["Манеж «Запад», ул. Генерала Дорохова, 10, Москва", "ул. Генерала Дорохова, 10, Москва"]


def test_match_in_another_city_is_ignored(client, login, fake_geocoder):
    created = client.post(
        "/api/events", headers=login("user@demo.ru"), json=event_payload(address="Ленина, 1", city="Красноярск")
    ).json()
    assert created["latitude"] is None and created["longitude"] is None


def test_unknown_address_keeps_event_without_point(client, login, fake_geocoder):
    created = client.post(
        "/api/events", headers=login("user@demo.ru"), json=event_payload(address="Где-то во дворе", city="Москва")
    )
    assert created.status_code == 201
    assert created.json()["latitude"] is None


def test_explicit_coordinates_skip_geocoder(client, login, fake_geocoder):
    client.post(
        "/api/events",
        headers=login("user@demo.ru"),
        json=event_payload(address="Остров Татышев", city="Красноярск", latitude=56.0, longitude=92.9),
    )
    assert fake_geocoder == []


def test_geocoder_failure_does_not_break_creation(client, login, monkeypatch):
    def broken(query: str) -> list[dict]:
        raise geocoding.httpx.ConnectError("нет сети")

    monkeypatch.setattr(geocoding, "GEOCODING_ENABLED", True)
    monkeypatch.setattr(geocoding, "_search", broken)
    geocoding.geocode.cache_clear()
    response = client.post("/api/events", headers=login("user@demo.ru"), json=event_payload(address="Остров Татышев", city="Красноярск"))
    geocoding.geocode.cache_clear()
    assert response.status_code == 201 and response.json()["latitude"] is None


def test_krasnoyarsk_demo_events_on_map(client):
    events = client.get("/api/events", params={"city": "Красноярск"}).json()
    assert len(events) >= 10
    assert all(56.9 > e["latitude"] > 55.9 and 93.1 > e["longitude"] > 92.7 for e in events)
