import os
from collections.abc import Callable, Iterator
from datetime import datetime, timedelta

# Тесты работают на отдельной in-memory базе; переменную нужно выставить до импорта приложения
os.environ["DATABASE_URL"] = "sqlite://"
os.environ["SEED_ON_STARTUP"] = "1"

import pytest
from fastapi.testclient import TestClient

from app.db import Base, engine
from app.main import app

Headers = dict[str, str]


@pytest.fixture
def client() -> Iterator[TestClient]:
    Base.metadata.drop_all(engine)
    with TestClient(app) as test_client:  # lifespan создаёт таблицы и заливает демо-данные
        yield test_client


@pytest.fixture
def login(client: TestClient) -> Callable[[str], Headers]:
    def _login(email: str) -> Headers:
        response = client.post("/api/auth/login", json={"email": email, "password": "demo1234"})
        assert response.status_code == 200, response.text
        return {"Authorization": f"Bearer {response.json()['token']}"}

    return _login


def future(days: int = 3, hour: int = 18) -> str:
    return (datetime.now() + timedelta(days=days)).replace(hour=hour, minute=0, second=0, microsecond=0).isoformat()


def event_payload(**overrides) -> dict:
    payload = {
        "title": "Тестовая встреча",
        "description": "Описание",
        "sport_name": "Футбол",
        "starts_at": future(),
        "city": "Москва",
        "address": "Тестовая улица, 1",
        "level": "any",
        "join_mode": "open",
    }
    payload.update(overrides)
    return payload


def find_event(client: TestClient, title: str, headers: Headers | None = None) -> dict:
    events = client.get("/api/events", params={"q": title}, headers=headers or {}).json()
    return next(e for e in events if e["title"] == title)
