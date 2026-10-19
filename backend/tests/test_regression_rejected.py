"""Регрессия: отклонённая заявка не попадает в состав участников и в счётчики."""

from tests.conftest import find_event


def test_rejected_applicant_is_not_a_participant(client, login):
    maria = login("neworg@demo.ru")
    oleg = login("org@demo.ru")
    event = find_event(client, "Шахматы для начинающих")
    count_before = event["participants_count"]

    request = client.post(f"/api/events/{event['id']}/join", headers=maria).json()
    assert request["status"] == "pending"
    client.post(f"/api/participations/{request['id']}/reject", headers=oleg)

    names = lambda items: [p["user"]["name"] for p in items]  # noqa: E731
    as_organizer = client.get(f"/api/events/{event['id']}/participants", headers=oleg).json()
    assert "Мария П." not in names(as_organizer["confirmed"])
    assert "Мария П." not in names(as_organizer["pending"])
    assert "Мария П." in names(as_organizer["rejected"])

    for headers in ({}, maria):
        public = client.get(f"/api/events/{event['id']}/participants", headers=headers).json()
        assert "Мария П." not in names(public["confirmed"])
        assert public["rejected"] == []

    assert client.get(f"/api/events/{event['id']}").json()["participants_count"] == count_before
    card = next(e for e in client.get("/api/events", params={"q": "начинающих"}).json() if e["id"] == event["id"])
    assert card["participants_count"] == count_before
    organized = next(e for e in client.get("/api/me/events", headers=oleg).json() if e["id"] == event["id"])
    assert organized["participants_count"] == count_before
    # У самой Марии запись видна как отклонённая, а не как участие
    mine = next(p for p in client.get("/api/me/participations", headers=maria).json() if p["event"]["id"] == event["id"])
    assert mine["status"] == "rejected"
