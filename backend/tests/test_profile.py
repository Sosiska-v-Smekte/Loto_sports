"""Редактирование своего профиля и публичный профиль."""


def test_user_edits_own_profile(client, login):
    anna = login("user2@demo.ru")
    me = client.get("/api/auth/me", headers=anna).json()
    response = client.patch(
        "/api/me", headers=anna, json={"name": "Анна Иванова", "city": "Санкт-Петербург", "about": "Теннис по выходным"}
    )
    assert response.status_code == 200
    public = client.get(f"/api/users/{me['id']}").json()["user"]
    assert (public["name"], public["city"], public["about"]) == (
        "Анна Иванова",
        "Санкт-Петербург",
        "Теннис по выходным",
    )


def test_profile_update_requires_login_and_valid_name(client, login):
    assert client.patch("/api/me", json={"name": "Кто-то", "city": "Москва"}).status_code == 401
    response = client.patch("/api/me", headers=login("user@demo.ru"), json={"name": " ", "city": "Москва"})
    assert response.status_code == 422
