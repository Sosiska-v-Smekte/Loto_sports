"""Проверки прав: всё, что фронт мог бы «спрятать», должно запрещаться и на бэкенде."""

from tests.conftest import event_payload, find_event


def _pending_request_id(client, oleg, title):
    event = find_event(client, title)
    return client.get(f"/api/events/{event['id']}/participants", headers=oleg).json()["pending"][0]["id"]


def test_stranger_cannot_decide_application(client, login):
    request_id = _pending_request_id(client, login("org@demo.ru"), "Вечер быстрых шахмат")
    for email in ("user@demo.ru", "admin@demo.ru"):  # админ заявки участников не рассматривает
        response = client.post(f"/api/participations/{request_id}/approve", headers=login(email))
        assert response.status_code == 403


def test_non_admin_cannot_moderate(client, login):
    ilya = login("user@demo.ru")
    event = find_event(client, "Стритбол в Лужниках")
    assert client.post(f"/api/admin/events/{event['id']}/unpublish", headers=ilya, json={"reason": "просто так"}).status_code == 403
    assert client.get("/api/admin/organizations", headers=ilya).status_code == 403
    assert client.post("/api/admin/organizations/2/approve", headers=ilya).status_code == 403
    assert client.post("/api/admin/comments/1/hide", headers=ilya, json={"reason": "спам"}).status_code == 403
    assert client.get("/api/admin/events").status_code == 401


def test_pending_organization_cannot_publish(client, login):
    owner = login("pending@demo.ru")
    org = client.get("/api/me/organization", headers=owner).json()
    response = client.post("/api/events", headers=owner, json=event_payload(organization_id=org["id"]))
    assert response.status_code == 403
    assert "проверку" in response.json()["detail"]


def test_cannot_publish_for_someone_elses_organization(client, login):
    oleg_org = client.get("/api/me/organization", headers=login("org@demo.ru")).json()
    response = client.post("/api/events", headers=login("user@demo.ru"), json=event_payload(organization_id=oleg_org["id"]))
    assert response.status_code == 403


def test_hidden_comment_not_returned_to_users(client, login):
    admin = login("admin@demo.ru")
    event = find_event(client, "Вечер быстрых шахмат")
    thread = client.get(f"/api/events/{event['id']}/comments").json()
    target = thread[0]
    hidden = client.post(f"/api/admin/comments/{target['id']}/hide", headers=admin, json={"reason": "Оскорбление"})
    assert hidden.status_code == 200

    for headers in ({}, login("user@demo.ru")):
        public = client.get(f"/api/events/{event['id']}/comments", headers=headers).json()
        assert len(public) == len(thread)  # остальные сообщения на месте
        hidden_item = next(c for c in public if c["id"] == target["id"])
        assert hidden_item["is_hidden"] is True and hidden_item["text"] is None
        assert hidden_item["hidden_reason"] is None

    admin_view = client.get(f"/api/events/{event['id']}/comments", headers=admin).json()
    original = next(c for c in admin_view if c["id"] == target["id"])
    assert original["text"] == target["text"] and original["hidden_reason"] == "Оскорбление"


def test_organizer_cannot_join_own_event(client, login):
    event = find_event(client, "Вечер быстрых шахмат")
    assert client.post(f"/api/events/{event['id']}/join", headers=login("org@demo.ru")).status_code == 403


def test_join_requires_login(client):
    event = find_event(client, "Стритбол в Лужниках")
    assert client.post(f"/api/events/{event['id']}/join").status_code == 401


def test_event_in_past_rejected(client, login):
    response = client.post(
        "/api/events", headers=login("user@demo.ru"), json=event_payload(starts_at="2020-01-01T10:00:00")
    )
    assert response.status_code == 400


def test_participants_pending_hidden_from_others(client, login):
    event = find_event(client, "Вечер быстрых шахмат")
    other = client.get(f"/api/events/{event['id']}/participants", headers=login("user@demo.ru")).json()
    assert other["pending"] == [] and other["rejected"] == []
