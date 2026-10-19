"""Сценарий 1: пользователь создаёт событие со своим новым направлением, другой находит его в поиске."""

from app.services.sports import normalize_sport_name
from tests.conftest import event_payload


def test_custom_sport_event_is_searchable(client, login):
    ilya = login("user@demo.ru")
    response = client.post(
        "/api/events",
        headers=ilya,
        json=event_payload(title="Фрисби в Нескучном саду", sport_name="  алтимат   фрисби "),
    )
    assert response.status_code == 201, response.text
    event = response.json()
    assert event["sport"]["name"] == "Алтимат фрисби"
    assert event["sport"]["is_custom"] is True
    assert event["status"] == "published"

    # Повторный ввод в другом регистре не плодит дубли
    again = client.post(
        "/api/events", headers=ilya, json=event_payload(title="Ещё фрисби", sport_name="АЛТИМАТ Фрисби")
    ).json()
    assert again["sport"]["id"] == event["sport"]["id"]

    anna = login("user2@demo.ru")
    found = client.get("/api/events", params={"q": "фрисби", "city": "Москва"}, headers=anna).json()
    assert event["id"] in [e["id"] for e in found]
    by_sport = client.get("/api/events", params={"sport_id": event["sport"]["id"]}).json()
    assert {e["id"] for e in by_sport} == {event["id"], again["id"]}

    opened = client.get(f"/api/events/{event['id']}", headers=anna)
    assert opened.status_code == 200
    assert opened.json()["title"] == "Фрисби в Нескучном саду"


def test_normalization_rules():
    assert normalize_sport_name("  Хоккей   на  ТРАВЕ ") == "хоккей на траве"
    assert normalize_sport_name("Лёгкая атлетика") == normalize_sport_name("легкая атлетика")


def test_existing_sport_is_reused(client, login):
    ilya = login("user@demo.ru")
    first = client.post("/api/events", headers=ilya, json=event_payload(sport_name="скандинавская  ХОДЬБА")).json()
    seeded = client.get("/api/sports", params={"q": "скандинав"}).json()
    assert len(seeded) == 1
    assert first["sport"]["id"] == seeded[0]["id"]
