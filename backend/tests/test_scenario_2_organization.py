"""Сценарий 2: организация подаёт заявку, админ отклоняет/одобряет, после одобрения публикует события."""

from tests.conftest import event_payload

ORG = {
    "name": "Клуб скандинавской ходьбы «Шаг»",
    "description": "Гуляем с палками по паркам Москвы каждую субботу.",
    "sports": "Скандинавская ходьба",
    "city": "Москва",
    "contacts": "+7 900 000-00-00",
}


def test_organization_lifecycle(client, login):
    maria = login("neworg@demo.ru")
    admin = login("admin@demo.ru")
    assert client.get("/api/me/organization", headers=maria).json() is None

    created = client.post("/api/me/organization", headers=maria, json=ORG)
    assert created.status_code == 201
    org = created.json()
    assert org["status"] == "pending"

    # До одобрения: нет публичной страницы и нельзя публиковать от имени организации
    assert client.get(f"/api/organizations/{org['id']}").status_code == 404
    assert org["id"] not in [o["id"] for o in client.get("/api/organizations").json()]
    denied = client.post("/api/events", headers=maria, json=event_payload(organization_id=org["id"]))
    assert denied.status_code == 403

    # Админ видит заявку и отклоняет с причиной — причина видна владельцу
    pending = client.get("/api/admin/organizations", params={"status": "pending"}, headers=admin).json()
    assert org["id"] in [o["id"] for o in pending]
    reason = "Добавьте адрес, где проходят тренировки"
    rejected = client.post(f"/api/admin/organizations/{org['id']}/reject", headers=admin, json={"reason": reason})
    assert rejected.status_code == 200
    mine = client.get("/api/me/organization", headers=maria).json()
    assert mine["status"] == "rejected"
    assert mine["rejection_reason"] == reason

    # Владелец исправляет и отправляет снова, админ одобряет
    resent = client.post("/api/me/organization", headers=maria, json={**ORG, "description": ORG["description"] + " Сбор у м. Сокольники."})
    assert resent.json()["status"] == "pending"
    approved = client.post(f"/api/admin/organizations/{org['id']}/approve", headers=admin)
    assert approved.json()["status"] == "approved"

    # Публикация без повторной модерации: событие сразу в ленте и на странице организации
    event = client.post(
        "/api/events", headers=maria, json=event_payload(title="Субботняя прогулка «Шага»", organization_id=org["id"])
    )
    assert event.status_code == 201
    event_id = event.json()["id"]
    assert event.json()["organization"]["id"] == org["id"]
    assert event_id in [e["id"] for e in client.get("/api/events", params={"city": "Москва"}).json()]
    page = client.get(f"/api/organizations/{org['id']}").json()
    assert event_id in [e["id"] for e in page["events"]]


def test_seeded_pending_organization_can_be_approved(client, login):
    admin = login("admin@demo.ru")
    owner = login("pending@demo.ru")
    org = client.get("/api/me/organization", headers=owner).json()
    assert org["status"] == "pending"
    client.post(f"/api/admin/organizations/{org['id']}/approve", headers=admin)
    assert client.get(f"/api/organizations/{org['id']}").status_code == 200
