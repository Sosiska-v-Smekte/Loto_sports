"""Площадки и зоны: одно мероприятие на зону, разные зоны не конфликтуют, вместимость ограничивает запись."""

from datetime import datetime, timedelta

from tests.conftest import event_payload, future


def _zones(client, login):
    venue = client.get("/api/venues", params={"city": "Москва"}).json()[0]
    return venue, {z["name"]: z for z in venue["zones"]}


def _create(client, headers, zone, start_hour, end_hour, **extra):
    return client.post(
        "/api/events",
        headers=headers,
        json=event_payload(
            title=extra.pop("title", "Занятие в зале"),
            zone_id=zone["id"],
            starts_at=future(4, start_hour),
            ends_at=future(4, end_hour),
            **extra,
        ),
    )


def test_demo_venue_has_zones_with_group(client, login):
    venue, zones = _zones(client, login)
    assert venue["name"] == "Спортивный центр «Старт»"
    assert {"Футбольное поле", "Малый зал", "Стол №1", "Стол №2", "Стол №3"} <= set(zones)
    assert zones["Стол №1"]["group_name"] == "Зал настольного тенниса"
    assert zones["Малый зал"]["capacity"] == 12


def test_second_event_in_same_zone_conflicts_with_suggestion(client, login):
    oleg = login("org@demo.ru")
    _, zones = _zones(client, login)
    hall = zones["Малый зал"]
    first = _create(client, oleg, hall, 18, 19, title="Первая группа")
    assert first.status_code == 201
    assert first.json()["zone"]["name"] == "Малый зал"
    assert first.json()["address"] == "ул. Ленина, 10"

    clash = _create(client, login("user@demo.ru"), hall, 18, 20, title="Вторая группа")
    assert clash.status_code == 409
    detail = clash.json()["detail"]
    assert "Малый зал" in detail and "Первая группа" in detail
    # Буфер 15 минут: свободно с 19:15
    assert "19:15" in detail


def test_availability_endpoint_returns_suggestion(client, login):
    oleg = login("org@demo.ru")
    _, zones = _zones(client, login)
    hall = zones["Малый зал"]
    assert _create(client, oleg, hall, 18, 19).status_code == 201
    result = client.get(
        f"/api/zones/{hall['id']}/availability", params={"starts_at": future(4, 18), "ends_at": future(4, 20)}
    ).json()
    assert result["free"] is False
    assert datetime.fromisoformat(result["suggestion"]["starts_at"]).hour == 19
    assert len(result["busy"]) == 1
    free = client.get(
        f"/api/zones/{hall['id']}/availability", params={"starts_at": future(4, 21), "ends_at": future(4, 22)}
    ).json()
    assert free["free"] is True


def test_other_zones_and_after_buffer_do_not_conflict(client, login):
    oleg = login("org@demo.ru")
    _, zones = _zones(client, login)
    assert _create(client, oleg, zones["Малый зал"], 18, 19).status_code == 201
    assert _create(client, oleg, zones["Футбольное поле"], 18, 19, title="Футбол").status_code == 201
    assert _create(client, oleg, zones["Стол №1"], 18, 19, title="Стол 1").status_code == 201
    assert _create(client, oleg, zones["Стол №2"], 18, 19, title="Стол 2").status_code == 201
    later = client.post(
        "/api/events",
        headers=oleg,
        json=event_payload(
            title="После уборки",
            zone_id=zones["Малый зал"]["id"],
            starts_at=(datetime.fromisoformat(future(4, 19)) + timedelta(minutes=15)).isoformat(),
            ends_at=future(4, 21),
        ),
    )
    assert later.status_code == 201


def test_unpublished_event_releases_zone(client, login):
    admin = login("admin@demo.ru")
    oleg = login("org@demo.ru")
    _, zones = _zones(client, login)
    hall = zones["Малый зал"]
    event = _create(client, oleg, hall, 18, 19).json()
    assert _create(client, oleg, hall, 18, 19, title="Другая").status_code == 409
    assert client.post(f"/api/admin/events/{event['id']}/unpublish", headers=admin, json={"reason": "Нарушение"}).status_code == 200
    assert _create(client, oleg, hall, 18, 19, title="Другая").status_code == 201


def test_zone_requires_end_time(client, login):
    _, zones = _zones(client, login)
    response = client.post(
        "/api/events",
        headers=login("org@demo.ru"),
        json=event_payload(zone_id=zones["Малый зал"]["id"]),
    )
    assert response.status_code == 400


def test_capacity_limits_signup(client, login):
    oleg = login("org@demo.ru")
    _, zones = _zones(client, login)
    table = zones["Стол №3"]
    event = _create(client, oleg, table, 18, 19, title="Пинг-понг").json()
    users = ["user@demo.ru", "user2@demo.ru", "ivan@demo.ru", "neworg@demo.ru", "pending@demo.ru"]
    codes = [client.post(f"/api/events/{event['id']}/join", headers=login(e)).status_code for e in users]
    assert codes == [201, 201, 201, 201, 409]


def test_only_approved_organization_or_admin_can_add_venue(client, login):
    body = {
        "name": "Новый зал",
        "city": "Москва",
        "address": "ул. Тестовая, 5",
        "zones": [{"name": "Зал", "capacity": 10, "buffer_minutes": 10}],
    }
    assert client.post("/api/venues", headers=login("user@demo.ru"), json=body).status_code == 403
    created = client.post("/api/venues", headers=login("org@demo.ru"), json=body)
    assert created.status_code == 201
    venue = created.json()
    assert venue["can_manage"] is True
    added = client.post(
        f"/api/venues/{venue['id']}/zones", headers=login("org@demo.ru"), json={"name": "Зал 2", "capacity": 8}
    )
    assert len(added.json()["zones"]) == 2
    assert client.post(
        f"/api/venues/{venue['id']}/zones", headers=login("user@demo.ru"), json={"name": "Зал 3", "capacity": 8}
    ).status_code == 403
    zone_id = added.json()["zones"][1]["id"]
    assert client.delete(f"/api/zones/{zone_id}", headers=login("org@demo.ru")).status_code == 200
