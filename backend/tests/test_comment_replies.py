"""Ответы на сообщения: ветка в один уровень, цитата, скрытие исходного сообщения."""

from tests.conftest import find_event


def _post(client, event_id, headers, text, parent_id=None):
    response = client.post(f"/api/events/{event_id}/comments", headers=headers, json={"text": text, "parent_id": parent_id})
    assert response.status_code == 201, response.text
    return response.json()


def test_reply_and_reply_to_reply_share_root(client, login):
    anna, oleg = login("user2@demo.ru"), login("org@demo.ru")
    event = find_event(client, "Шахматы для начинающих")

    question = _post(client, event["id"], anna, "Нужно ли знать дебюты?")
    assert question["root_id"] == question["id"] and question["reply_to"] is None

    answer = _post(client, event["id"], oleg, "Нет, всему научим.", question["id"])
    assert answer["root_id"] == question["id"]
    assert answer["is_organizer_reply"] is True
    assert answer["reply_to"] == {"id": question["id"], "author_name": "Анна И.", "excerpt": "Нужно ли знать дебюты?"}

    # Ответ на ответ остаётся в той же ветке, но помнит, кому именно ответили
    thanks = _post(client, event["id"], anna, "Спасибо!", answer["id"])
    assert thanks["root_id"] == question["id"]
    assert thanks["parent_id"] == answer["id"]
    assert thanks["reply_to"]["author_name"] == "Олег К."


def test_parent_must_belong_to_same_event(client, login):
    anna = login("user2@demo.ru")
    other = find_event(client, "Вечер быстрых шахмат")
    foreign = client.get(f"/api/events/{other['id']}/comments").json()[0]
    event = find_event(client, "Шахматы для начинающих")
    response = client.post(
        f"/api/events/{event['id']}/comments", headers=anna, json={"text": "Привет", "parent_id": foreign["id"]}
    )
    assert response.status_code == 400


def test_hidden_parent_keeps_replies(client, login):
    admin = login("admin@demo.ru")
    event = find_event(client, "Вечер быстрых шахмат")
    thread = client.get(f"/api/events/{event['id']}/comments").json()
    root = next(c for c in thread if c["reply_to"] is None and any(r["root_id"] == c["id"] and r["id"] != c["id"] for r in thread))
    replies = [c["id"] for c in thread if c["root_id"] == root["id"] and c["id"] != root["id"]]

    client.post(f"/api/admin/comments/{root['id']}/hide", headers=admin, json={"reason": "Не по теме"})

    public = client.get(f"/api/events/{event['id']}/comments").json()
    hidden = next(c for c in public if c["id"] == root["id"])
    assert hidden["is_hidden"] and hidden["text"] is None
    assert [c["id"] for c in public if c["root_id"] == root["id"] and c["id"] != root["id"]] == replies
    direct = next(c for c in public if c["parent_id"] == root["id"])
    assert direct["reply_to"]["excerpt"] is None  # цитата скрытого сообщения не раскрывается
