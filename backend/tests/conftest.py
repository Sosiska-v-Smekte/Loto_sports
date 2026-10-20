import os
from collections.abc import Callable, Iterator
from datetime import datetime, timedelta

os.environ["DATABASE_URL"] = os.getenv(
    "TEST_DATABASE_URL", "postgresql+psycopg://sport:sport@localhost:5432/sport_club_test"
)
os.environ["SEED_ON_STARTUP"] = "1"
os.environ["GEOCODING_ENABLED"] = "0"

import pytest
from fastapi.testclient import TestClient

from app.db import reset_schema
from app.main import app

Headers = dict[str, str]


@pytest.fixture
def client() -> Iterator[TestClient]:
    reset_schema()
    with TestClient(app) as test_client:
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
