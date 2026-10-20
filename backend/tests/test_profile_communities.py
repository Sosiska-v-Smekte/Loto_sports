"""Профиль (направления, статистика, настройки), вступление в сообщества, отмена записи."""

from tests.conftest import find_event


def test_profile_page_has_sports_and_stats(client, login):
    ilya = client.get("/api/auth/me", headers=login("user@demo.ru")).json()
    page = client.get(f"/api/users/{ilya['id']}").json()
    assert {s["sport"]["name"]: s["level"] for s in page["sports"]} == {
        "Бег": "amateur",
        "Футбол": "amateur",
        "Шахматы": "beginner",
    }
    assert page["stats"]["clubs"] == 3
    assert page["stats"]["organized"] >= 1


def test_set_sports_and_notification_settings(client, login):
    headers = login("user2@demo.ru")
    sports = client.get("/api/sports").json()
    swim = next(s for s in sports if s["name"] == "Плавание")
    saved = client.put("/api/me/sports", headers=headers, json=[{"sport_id": swim["id"], "level": "pro"}])
    assert saved.status_code == 200 and saved.json()[0]["level"] == "pro"
    assert client.put("/api/me/sports", headers=headers, json=[{"sport_id": 9999, "level": "pro"}]).status_code == 400

    me = client.get("/api/auth/me", headers=headers).json()
    assert me["notify_new"] is True and me["notify_remind"] is True
    updated = client.patch(
        "/api/me", headers=headers, json={"name": me["name"], "city": "Москва", "about": "", "notify_remind": False}
    ).json()
    assert updated["notify_remind"] is False and updated["notify_new"] is True


def test_join_and_leave_community(client, login):
    headers = login("neworg@demo.ru")
    orgs = client.get("/api/organizations", headers=headers).json()
    club = next(o for o in orgs if o["name"] == "ФК «Авангард»")
    assert club["sport"]["name"] == "Футбол" and club["is_member"] is False and club["active_events_count"] == 1
    joined = client.post(f"/api/organizations/{club['id']}/join", headers=headers).json()
    assert joined["is_member"] is True and joined["members_count"] == club["members_count"] + 1
    left = client.delete(f"/api/organizations/{club['id']}/join", headers=headers).json()
    assert left["is_member"] is False and left["members_count"] == club["members_count"]
    assert client.post(f"/api/organizations/{club['id']}/join").status_code == 401
    # Владелец уже внутри
    owner = login("avangard@demo.ru")
    assert client.post(f"/api/organizations/{club['id']}/join", headers=owner).status_code == 409


def test_cancel_participation(client, login):
    headers = login("neworg@demo.ru")
    event = find_event(client, "Стритбол в Лужниках")
    joined = client.post(f"/api/events/{event['id']}/join", headers=headers).json()
    assert client.delete(f"/api/me/participations/{joined['id']}", headers=login("ivan@demo.ru")).status_code == 404
    assert client.delete(f"/api/me/participations/{joined['id']}", headers=headers).status_code == 204
    # После отмены можно записаться снова
    assert client.post(f"/api/events/{event['id']}/join", headers=headers).status_code == 201
