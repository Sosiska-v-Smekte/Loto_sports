"""Сценарий 5: вопрос в обсуждении и ответ организатора, помеченный как ответ организатора."""

from tests.conftest import find_event


def test_question_and_organizer_reply(client, login):
    maria = login("neworg@demo.ru")
    oleg = login("org@demo.ru")
    event = find_event(client, "Блиц-турнир «Осенний ход»")

    question = client.post(f"/api/events/{event['id']}/comments", headers=maria, json={"text": "Нужен ли свой комплект?"})
    assert question.status_code == 201
    assert question.json()["is_organizer_reply"] is False

    # Событие от имени организации: ответ её владельца помечается как ответ организатора
    answer = client.post(f"/api/events/{event['id']}/comments", headers=oleg, json={"text": "Нет, всё есть в клубе."})
    assert answer.json()["is_organizer_reply"] is True

    thread = client.get(f"/api/events/{event['id']}/comments").json()
    assert [(c["author"]["name"], c["is_organizer_reply"]) for c in thread[-2:]] == [
        ("Мария П.", False),
        ("Олег К.", True),
    ]


def test_empty_comment_rejected(client, login):
    event = find_event(client, "Стритбол в Лужниках")
    response = client.post(f"/api/events/{event['id']}/comments", headers=login("user@demo.ru"), json={"text": "   "})
    assert response.status_code == 422
    assert isinstance(response.json()["detail"], str)
