"""Строгая проверка email и города из справочника."""

import pytest

from tests.conftest import event_payload

BAD_EMAILS = [
    "test@fsdkf;j.ru",
    "a@b",
    "a@@b.ru",
    "a b@c.ru",
    "user@почта.рф",
    "почта@mail.ru",
    "user@mail..ru",
    "@mail.ru",
    "user@",
    "user@-mail.ru",
    "plainaddress",
]


def _register(client, email="new.person@mail.ru", city="Москва"):
    return client.post(
        "/api/auth/register", json={"name": "Новый Человек", "email": email, "password": "secret123", "city": city}
    )


@pytest.mark.parametrize("email", BAD_EMAILS)
def test_invalid_emails_rejected(client, email):
    response = _register(client, email=email)
    assert response.status_code == 422, email
    assert response.json()["detail"] == "Введите корректный email"


def test_valid_email_is_normalized_and_unique_case_insensitive(client):
    response = _register(client, email="Ivan.Petrov@Mail.RU")
    assert response.status_code == 201
    assert response.json()["user"]["email"] == "ivan.petrov@mail.ru"
    assert _register(client, email="ivan.petrov@mail.ru").status_code == 409
    assert _register(client, email="USER@DEMO.RU").status_code == 409
    # Вход тоже без учёта регистра
    login = client.post("/api/auth/login", json={"email": "IVAN.PETROV@mail.ru", "password": "secret123"})
    assert login.status_code == 200


def test_cities_directory(client):
    cities = client.get("/api/cities").json()
    assert len(cities) >= 100
    for city in ("Москва", "Санкт-Петербург", "Красноярск", "Новосибирск"):
        assert city in cities


def test_city_is_normalized_to_directory_spelling(client):
    response = _register(client, city="  орел ")
    assert response.status_code == 201
    assert response.json()["user"]["city"] == "Орёл"


def test_unknown_city_rejected_everywhere(client, login):
    expected = "Выберите город из списка"
    assert _register(client, city="Неизвестноград").json()["detail"] == expected

    ilya = login("user@demo.ru")
    event = client.post("/api/events", headers=ilya, json=event_payload(city="Атлантида"))
    assert event.status_code == 422 and event.json()["detail"] == expected

    profile = client.patch("/api/me", headers=ilya, json={"name": "Илья С.", "city": "Нигдеград"})
    assert profile.status_code == 422 and profile.json()["detail"] == expected

    org = client.post(
        "/api/me/organization",
        headers=login("neworg@demo.ru"),
        json={"name": "Клуб", "description": "Описание клуба", "sports": "Бег", "city": "Готэм", "contacts": "+7 900"},
    )
    assert org.status_code == 422 and org.json()["detail"] == expected


def test_seed_uses_directory_cities(client):
    cities = set(client.get("/api/cities").json())
    events = client.get("/api/events").json()
    assert {e["city"] for e in events} <= cities


def test_every_directory_city_has_center(client):
    cities = client.get("/api/cities").json()
    centers = client.get("/api/cities/centers").json()
    assert set(cities) == set(centers)
    lat, lng = centers["Красноярск"]
    assert 55.9 < lat < 56.1 and 92.7 < lng < 93.0
