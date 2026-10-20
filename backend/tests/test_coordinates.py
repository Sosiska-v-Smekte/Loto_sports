"""Координаты мероприятий для карты на главной."""

from tests.conftest import event_payload


def test_seeded_events_have_coordinates(client):
    events = client.get("/api/events", params={"city": "Москва"}).json()
    assert events and all(e["latitude"] is not None and e["longitude"] is not None for e in events)


def test_coordinates_are_optional_and_validated(client, login):
    ilya = login("user@demo.ru")
    without = client.post("/api/events", headers=ilya, json=event_payload(title="Без точки на карте")).json()
    assert without["latitude"] is None and without["longitude"] is None

    with_point = client.post(
        "/api/events", headers=ilya, json=event_payload(title="С точкой", latitude=56.0106, longitude=92.8526)
    ).json()
    assert (with_point["latitude"], with_point["longitude"]) == (56.0106, 92.8526)

    assert client.post("/api/events", headers=ilya, json=event_payload(latitude=123, longitude=10)).status_code == 422
