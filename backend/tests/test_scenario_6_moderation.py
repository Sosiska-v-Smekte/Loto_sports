"""Сценарий 6: админ снимает событие — его нет в выдаче, запись отклоняется, у записанного статус «снято»."""

from tests.conftest import find_event


def test_unpublished_event_disappears_and_blocks_joining(client, login):
    admin = login("admin@demo.ru")
    ilya = login("user@demo.ru")
    maria = login("neworg@demo.ru")
    event = find_event(client, "Стритбол в Лужниках")  # Илья записан сидом

    reason = "Площадка закрыта на ремонт"
    response = client.post(f"/api/admin/events/{event['id']}/unpublish", headers=admin, json={"reason": reason})
    assert response.json()["status"] == "unpublished"

    assert event["id"] not in [e["id"] for e in client.get("/api/events").json()]
    assert event["id"] not in [e["id"] for e in client.get("/api/events", params={"q": "Стритбол"}).json()]

    # Прямой запрос на запись отклоняется с понятным текстом
    join = client.post(f"/api/events/{event['id']}/join", headers=maria)
    assert join.status_code == 409
    assert "снято" in join.json()["detail"]

    # Посторонний по прямой ссылке видит «недоступно», записавшийся — причину
    assert client.get(f"/api/events/{event['id']}", headers=maria).json() == {"detail": "Мероприятие недоступно"}
    seen = client.get(f"/api/events/{event['id']}", headers=ilya).json()
    assert seen["status"] == "unpublished" and seen["moderation_reason"] == reason

    mine = client.get("/api/me/participations", headers=ilya).json()
    record = next(p for p in mine if p["event"]["id"] == event["id"])
    assert record["status"] == "confirmed" and record["event"]["status"] == "unpublished"

    # Организатор видит причину в «Я организую»
    ivan = login("ivan@demo.ru")
    organized = client.get("/api/me/events", headers=ivan).json()
    assert next(e for e in organized if e["id"] == event["id"])["moderation_reason"] == reason


def test_deleted_event_is_gone_everywhere(client, login):
    admin = login("admin@demo.ru")
    ilya = login("user@demo.ru")
    event = find_event(client, "Стритбол в Лужниках")
    client.post(f"/api/admin/events/{event['id']}/delete", headers=admin, json={"reason": "Дубликат"})

    assert client.get(f"/api/events/{event['id']}", headers=ilya).status_code == 404
    assert event["id"] not in [e["id"] for e in client.get("/api/events").json()]
    # Записавшийся видит в «Моих активностях», что мероприятие удалено и может скрыть запись
    record = next(
        p for p in client.get("/api/me/participations", headers=ilya).json() if p["event"]["id"] == event["id"]
    )
    assert record["event"]["status"] == "deleted" and record["event"]["moderation_reason"] == "Дубликат"
    assert client.post(f"/api/events/{event['id']}/join", headers=login("neworg@demo.ru")).status_code == 404
    # Админ продолжает видеть удалённое в своём списке
    deleted = client.get("/api/admin/events", params={"status": "deleted"}, headers=admin).json()
    assert event["id"] in [e["id"] for e in deleted]


def test_seeded_unpublished_event_shows_for_participant(client, login):
    ilya = login("user@demo.ru")
    mine = client.get("/api/me/participations", headers=ilya).json()
    removed = [p for p in mine if p["event"]["status"] == "unpublished"]
    assert len(removed) == 1
    assert removed[0]["event"]["moderation_reason"]
