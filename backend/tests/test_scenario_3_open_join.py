"""Сценарий 3: свободная запись сразу подтверждает участие, организатор видит участника."""

from tests.conftest import find_event


def test_open_join_is_confirmed_immediately(client, login):
    maria = login("neworg@demo.ru")
    event = find_event(client, "Стритбол в Лужниках")
    assert event["join_mode"] == "open"

    joined = client.post(f"/api/events/{event['id']}/join", headers=maria)
    assert joined.status_code == 201
    assert joined.json()["status"] == "confirmed"

    view = client.get(f"/api/events/{event['id']}", headers=maria).json()
    assert view["my_participation"]["status"] == "confirmed"
    assert view["participants_count"] == event["participants_count"] + 1

    ivan = login("ivan@demo.ru")
    participants = client.get(f"/api/events/{event['id']}/participants", headers=ivan).json()
    assert "Мария П." in [p["user"]["name"] for p in participants["confirmed"]]

    mine = client.get("/api/me/participations", headers=maria).json()
    assert event["id"] in [p["event"]["id"] for p in mine if p["status"] == "confirmed"]

    # Повторная запись запрещена
    assert client.post(f"/api/events/{event['id']}/join", headers=maria).status_code == 409
