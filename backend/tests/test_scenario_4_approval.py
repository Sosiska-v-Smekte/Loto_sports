"""Сценарий 4: заявка на событие «по заявке», принятие и отклонение, статус виден обеим сторонам."""

from tests.conftest import find_event


def _pending_of(client, event_id, headers):
    return client.get(f"/api/events/{event_id}/participants", headers=headers).json()["pending"]


def test_application_approved(client, login):
    maria = login("neworg@demo.ru")
    oleg = login("org@demo.ru")
    event = find_event(client, "Вечер быстрых шахмат")
    assert event["join_mode"] == "approval"

    applied = client.post(f"/api/events/{event['id']}/join", headers=maria).json()
    assert applied["status"] == "pending"
    view = client.get(f"/api/events/{event['id']}", headers=maria).json()
    assert view["my_participation"]["status"] == "pending"
    # До подтверждения пользователь не участник
    confirmed = client.get(f"/api/events/{event['id']}/participants").json()["confirmed"]
    assert "Мария П." not in [p["user"]["name"] for p in confirmed]

    pending = _pending_of(client, event["id"], oleg)
    request = next(p for p in pending if p["user"]["name"] == "Мария П.")
    decided = client.post(f"/api/participations/{request['id']}/approve", headers=oleg)
    assert decided.json()["status"] == "confirmed"

    assert client.get(f"/api/events/{event['id']}", headers=maria).json()["my_participation"]["status"] == "confirmed"
    confirmed = client.get(f"/api/events/{event['id']}/participants", headers=oleg).json()["confirmed"]
    assert "Мария П." in [p["user"]["name"] for p in confirmed]


def test_application_rejected(client, login):
    anna = login("user2@demo.ru")
    oleg = login("org@demo.ru")
    event = find_event(client, "Шахматы для начинающих")

    # Заявка Анны заведена сидом
    request = next(p for p in _pending_of(client, event["id"], oleg) if p["user"]["name"] == "Анна И.")
    rejected = client.post(f"/api/participations/{request['id']}/reject", headers=oleg)
    assert rejected.json()["status"] == "rejected"

    rejected_list = client.get(f"/api/events/{event['id']}/participants", headers=oleg).json()["rejected"]
    assert "Анна И." in [p["user"]["name"] for p in rejected_list]
    mine = client.get("/api/me/participations", headers=anna).json()
    assert next(p for p in mine if p["event"]["id"] == event["id"])["status"] == "rejected"
    # Повторно рассмотреть ту же заявку нельзя
    assert client.post(f"/api/participations/{request['id']}/approve", headers=oleg).status_code == 409
