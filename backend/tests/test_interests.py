"""«Я бы пошёл»: спрос складывается из отметок, новое подходящее мероприятие приглашает, но не записывает."""

from datetime import datetime, timedelta

from tests.conftest import event_payload


def _sport(client, name):
    return next(s for s in client.get("/api/sports").json() if s["name"] == name)


def _next_weekday(weekday: int, hour: int) -> str:
    day = datetime.now() + timedelta(days=1)
    while day.weekday() != weekday:
        day += timedelta(days=1)
    return day.replace(hour=hour, minute=0, second=0, microsecond=0).isoformat()


def test_demand_groups_demo_interests(client, login):
    groups = client.get("/api/interests/demand", params={"city": "Москва"}).json()
    volleyball = next(g for g in groups if g["sport"]["name"] == "Волейбол")
    assert (volleyball["count"], volleyball["day_kind"], volleyball["day_part"]) == (5, "weekend", "day")
    assert "Центральный" in volleyball["districts"]
    assert volleyball["mine"] is False
    mine = client.get("/api/interests/demand", params={"city": "Москва"}, headers=login("user@demo.ru")).json()
    assert next(g for g in mine if g["sport"]["name"] == "Волейбол")["mine"] is True


def test_add_and_remove_interest(client, login):
    anna = login("user2@demo.ru")
    tennis = _sport(client, "Теннис")
    created = client.post(
        "/api/interests",
        headers=anna,
        json={
            "sport_id": tennis["id"],
            "city": "Москва",
            "day_kinds": ["weekday", "weekend"],
            "day_parts": ["evening"],
        },
    )
    assert created.status_code == 201 and len(created.json()) == 2
    # Повтор не создаёт дублей
    again = client.post(
        "/api/interests",
        headers=anna,
        json={"sport_id": tennis["id"], "city": "Москва", "day_kinds": ["weekday"], "day_parts": ["evening"]},
    )
    assert again.status_code == 201
    assert (
        len([i for i in client.get("/api/interests/mine", headers=anna).json() if i["sport"]["name"] == "Теннис"]) == 2
    )
    interest_id = created.json()[0]["id"]
    assert client.delete(f"/api/interests/{interest_id}", headers=login("ivan@demo.ru")).status_code == 403
    assert client.delete(f"/api/interests/{interest_id}", headers=anna).status_code == 204
    assert client.post("/api/interests", json={}).status_code == 401


def test_matching_event_invites_but_does_not_join(client, login):
    volleyball = _sport(client, "Волейбол")
    organizer = login("ivan@demo.ru")
    response = client.post(
        "/api/events",
        headers=organizer,
        json=event_payload(
            title="Волейбол в субботу", sport_id=volleyball["id"], sport_name=None, starts_at=_next_weekday(5, 14)
        ),
    )
    assert response.status_code == 201
    event_id = response.json()["id"]

    anna = login("user2@demo.ru")
    notes = client.get("/api/notifications", headers=anna).json()
    invite = next(n for n in notes if n["type"] == "interest_invite")
    assert invite["link"] == f"/events/{event_id}"
    view = client.get(f"/api/events/{event_id}", headers=anna).json()
    assert view["my_participation"] is None
    # Организатор приглашение на своё же мероприятие не получает
    own = client.get("/api/notifications", headers=organizer).json()
    assert not [n for n in own if n["type"] == "interest_invite"]
    # Другое время суток не подходит
    evening = client.post(
        "/api/events",
        headers=organizer,
        json=event_payload(
            title="Волейбол вечером", sport_id=volleyball["id"], sport_name=None, starts_at=_next_weekday(5, 19)
        ),
    ).json()
    notes = client.get("/api/notifications", headers=anna).json()
    assert not [n for n in notes if n["link"] == f"/events/{evening['id']}"]


def test_custom_sport_interest_creates_sport(client, login):
    anna = login("user2@demo.ru")
    created = client.post(
        "/api/interests",
        headers=anna,
        json={"sport_name": "Дартс", "city": "Москва", "day_kinds": ["weekday"], "day_parts": ["evening"]},
    )
    assert created.status_code == 201
    assert created.json()[0]["sport"]["name"] == "Дартс" and created.json()[0]["sport"]["is_custom"] is True
    assert "Дартс" in [s["name"] for s in client.get("/api/sports").json()]
    assert (
        client.post(
            "/api/interests", headers=anna, json={"city": "Москва", "day_kinds": ["weekday"], "day_parts": ["day"]}
        ).status_code
        == 422
    )
