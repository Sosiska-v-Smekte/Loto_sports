"""Правка 7: пользователь убирает неактуальные записи из «Моих активностей»."""

from tests.conftest import find_event


def _mine(client, headers):
    return client.get("/api/me/participations", headers=headers).json()


def _record(client, headers, title):
    return next(p for p in _mine(client, headers) if p["event"]["title"] == title)


def test_hide_rejected_application(client, login):
    ivan, ilya = login("ivan@demo.ru"), login("user@demo.ru")
    # В сиде заявка Ивана на спарринг Ильи отклонена
    record = _record(client, ivan, "Теннис: спарринг для опытных")
    assert record["status"] == "rejected"

    assert client.post(f"/api/me/participations/{record['id']}/hide", headers=ivan).status_code == 204
    assert record["id"] not in [p["id"] for p in _mine(client, ivan)]

    # У организатора история заявок не пропала, а повторно подать заявку нельзя
    event = record["event"]
    rejected = client.get(f"/api/events/{event['id']}/participants", headers=ilya).json()["rejected"]
    assert "Иван Г." in [p["user"]["name"] for p in rejected]
    assert client.post(f"/api/events/{event['id']}/join", headers=ivan).status_code == 409


def test_hide_record_of_unpublished_event(client, login):
    ilya = login("user@demo.ru")
    record = next(p for p in _mine(client, ilya) if p["event"]["status"] == "unpublished")
    assert client.post(f"/api/me/participations/{record['id']}/hide", headers=ilya).status_code == 204
    assert record["id"] not in [p["id"] for p in _mine(client, ilya)]


def test_active_records_cannot_be_hidden(client, login):
    anna = login("user2@demo.ru")
    confirmed = next(p for p in _mine(client, anna) if p["status"] == "confirmed" and p["event"]["status"] == "published")
    pending = next(p for p in _mine(client, anna) if p["status"] == "pending")
    for record in (confirmed, pending):
        response = client.post(f"/api/me/participations/{record['id']}/hide", headers=anna)
        assert response.status_code == 409
    assert {confirmed["id"], pending["id"]} <= {p["id"] for p in _mine(client, anna)}


def test_cannot_hide_someone_elses_record(client, login):
    anna = login("user2@demo.ru")
    event = find_event(client, "Шахматы для начинающих")
    record = next(p for p in _mine(client, anna) if p["event"]["id"] == event["id"])
    other = login("neworg@demo.ru")
    assert client.post(f"/api/me/participations/{record['id']}/hide", headers=other).status_code == 404
