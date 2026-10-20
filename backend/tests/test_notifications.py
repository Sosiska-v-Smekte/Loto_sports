"""Правка 8: уведомления внутри приложения — по одному тесту на тип и защита от дублей."""

from tests.conftest import event_payload, find_event


def _notifications(client, headers, type_=None):
    items = client.get("/api/notifications", headers=headers).json()
    return [n for n in items if type_ is None or n["type"] == type_]


def test_reminder_for_participant_and_organizer_without_duplicates(client, login):
    anna, ivan = login("user2@demo.ru"), login("ivan@demo.ru")
    event = find_event(client, "Вечерний забег в Парке Горького")  # сегодня, Анна записана, Иван организатор

    for headers in (anna, ivan):
        reminders = [n for n in _notifications(client, headers, "reminder") if n["link"] == f"/events/{event['id']}"]
        assert len(reminders) == 1
        assert "Вечерний забег" in reminders[0]["body"]

    # Повторные запросы списка и счётчика не создают дублей
    client.get("/api/notifications/unread-count", headers=anna)
    client.get("/api/notifications", headers=anna)
    reminders = [n for n in _notifications(client, anna, "reminder") if n["link"] == f"/events/{event['id']}"]
    assert len(reminders) == 1


def test_no_reminder_for_far_or_unpublished_events(client, login):
    admin, anna = login("admin@demo.ru"), login("user2@demo.ru")
    football = find_event(client, "Любительский матч 5x5")  # сегодня, Анна записана
    client.post(f"/api/admin/events/{football['id']}/unpublish", headers=admin, json={"reason": "Поле занято"})

    links = {n["link"] for n in _notifications(client, anna, "reminder")}
    assert f"/events/{football['id']}" not in links
    nordic = find_event(client, "Скандинавская ходьба в Сокольниках")  # через 3 дня
    assert f"/events/{nordic['id']}" not in links


def test_reply_notifies_parent_author_but_not_self(client, login):
    anna, oleg = login("user2@demo.ru"), login("org@demo.ru")
    event = find_event(client, "Шахматы для начинающих")
    question = client.post(f"/api/events/{event['id']}/comments", headers=anna, json={"text": "Сколько длится занятие?"}).json()

    before = len(_notifications(client, anna, "reply"))
    client.post(f"/api/events/{event['id']}/comments", headers=anna, json={"text": "И ещё вопрос", "parent_id": question["id"]})
    assert len(_notifications(client, anna, "reply")) == before  # себе не уведомляем

    client.post(f"/api/events/{event['id']}/comments", headers=oleg, json={"text": "Полтора часа", "parent_id": question["id"]})
    replies = _notifications(client, anna, "reply")
    assert len(replies) == before + 1
    assert replies[0]["title"] == "Вам ответили" and "Полтора часа" in replies[0]["body"]
    assert replies[0]["link"] == f"/events/{event['id']}#discussion"


def test_participation_decision(client, login):
    maria, oleg = login("neworg@demo.ru"), login("org@demo.ru")
    approved_event = find_event(client, "Вечер быстрых шахмат")
    rejected_event = find_event(client, "Шахматы для начинающих")
    first = client.post(f"/api/events/{approved_event['id']}/join", headers=maria).json()
    second = client.post(f"/api/events/{rejected_event['id']}/join", headers=maria).json()
    client.post(f"/api/participations/{first['id']}/approve", headers=oleg)
    client.post(f"/api/participations/{second['id']}/reject", headers=oleg)

    titles = {n["link"]: n["title"] for n in _notifications(client, maria, "participation_decision")}
    assert titles[f"/events/{approved_event['id']}"] == "Вашу заявку приняли"
    assert titles[f"/events/{rejected_event['id']}"] == "Заявку отклонили"


def test_organization_request_and_review(client, login):
    maria, admin = login("neworg@demo.ru"), login("admin@demo.ru")
    org = client.post(
        "/api/me/organization",
        headers=maria,
        json={"name": "Клуб «Шаг»", "description": "Скандинавская ходьба по субботам", "sports": "Ходьба", "city": "Москва", "contacts": "+7 900"},
    ).json()
    requests = _notifications(client, admin, "organization_request")
    assert any("Клуб «Шаг»" in n["body"] for n in requests)

    client.post(f"/api/admin/organizations/{org['id']}/reject", headers=admin, json={"reason": "Нет адреса"})
    review = _notifications(client, maria, "organization_review")
    assert review[0]["title"] == "Заявку организации отклонили" and "Нет адреса" in review[0]["body"]

    client.post("/api/me/organization", headers=maria, json={**{k: org[k] for k in ("name", "description", "sports", "city")}, "contacts": "+7 900 1"})
    client.post(f"/api/admin/organizations/{org['id']}/approve", headers=admin)
    assert _notifications(client, maria, "organization_review")[0]["title"] == "Организация одобрена"


def test_unpublished_event_notifies_registered(client, login):
    admin, ilya = login("admin@demo.ru"), login("user@demo.ru")
    event = find_event(client, "Стритбол в Лужниках")  # Илья записан
    client.post(f"/api/admin/events/{event['id']}/unpublish", headers=admin, json={"reason": "Площадка на ремонте"})
    notes = [n for n in _notifications(client, ilya, "event_unpublished") if n["link"] == f"/events/{event['id']}"]
    assert len(notes) == 1 and notes[0]["title"] == "Мероприятие снято: Площадка на ремонте"


def test_read_one_read_all_and_privacy(client, login):
    ilya, anna = login("user@demo.ru"), login("user2@demo.ru")
    unread = client.get("/api/notifications/unread-count", headers=ilya).json()["count"]
    assert unread > 0  # демо-данные и напоминания
    first = _notifications(client, ilya)[0]

    assert client.post(f"/api/notifications/{first['id']}/read", headers=anna).status_code == 404
    assert client.post(f"/api/notifications/{first['id']}/read", headers=ilya).json()["is_read"] is True
    assert client.get("/api/notifications/unread-count", headers=ilya).json()["count"] == unread - 1

    assert client.post("/api/notifications/read-all", headers=ilya).status_code == 204
    assert client.get("/api/notifications/unread-count", headers=ilya).json()["count"] == 0
    assert client.get("/api/notifications").status_code == 401


def test_new_event_does_not_need_moderation(client, login):
    """Решение из задания: события пользователей публикуются сразу, модерация — постфактум."""
    response = client.post("/api/events", headers=login("user@demo.ru"), json=event_payload(title="Пробежка без модерации"))
    assert response.json()["status"] == "published"


def test_concurrent_reminder_creation_is_safe(client, login, monkeypatch):
    """Список и счётчик приходят одновременно: проигравший запрос не должен падать на уникальном ключе."""
    from app.db import SessionLocal
    from app.models import User
    from app.services import notifications

    with SessionLocal() as db:
        anna = db.query(User).filter_by(email="user2@demo.ru").one()
        notifications.ensure_reminders(db, anna)
        # Соседний запрос проверил наличие до того, как первый закоммитил вставку
        monkeypatch.setattr(notifications, "already_sent", lambda *_: False)
        notifications.ensure_reminders(db, anna)  # не должно бросить IntegrityError
    monkeypatch.undo()

    reminders = _notifications(client, login("user2@demo.ru"), "reminder")
    assert reminders and len({n["link"] for n in reminders}) == len(reminders)
