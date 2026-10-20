from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app.api import api_router
from app.config import CORS_ORIGINS, FRONTEND_DIST, SEED_ON_STARTUP
from app.db import SessionLocal, migrate
from app.seed import seed_if_empty

FIELD_LABELS = {
    "title": "Название",
    "description": "Описание",
    "sport_name": "Направление",
    "starts_at": "Дата и время начала",
    "ends_at": "Время окончания",
    "city": "Город",
    "address": "Адрес",
    "name": "Название",
    "email": "Email",
    "password": "Пароль",
    "sports": "Направления",
    "contacts": "Контакты",
    "reason": "Причина",
    "text": "Сообщение",
}

ERROR_TEXTS = {
    "missing": "обязательное поле",
    "string_too_short": "слишком короткое значение",
    "string_too_long": "слишком длинное значение",
    "string_pattern_mismatch": "неверный формат",
    "datetime_from_date_parsing": "неверная дата",
    "datetime_parsing": "неверная дата",
    "enum": "недопустимое значение",
    "literal_error": "недопустимое значение",
}


def _validation_message(exc: RequestValidationError) -> str:
    """Сводит ошибки Pydantic к одной понятной русской строке в едином формате {detail: str}."""
    parts = []
    for error in exc.errors():
        field = str(error["loc"][-1]) if error["loc"] else ""
        if field == "email":
            # Тексты email-validator английские и слишком техничные — даём одно понятное сообщение
            parts.append("Введите корректный email")
            continue
        if error["type"] == "value_error":
            parts.append(str(error["ctx"]["error"]))
            continue
        label = FIELD_LABELS.get(field, field)
        parts.append(f"{label}: {ERROR_TEXTS.get(error['type'], 'неверное значение')}")
    return "; ".join(dict.fromkeys(parts)) or "Проверьте введённые данные"


@asynccontextmanager
async def lifespan(_: FastAPI):
    migrate()
    if SEED_ON_STARTUP:
        with SessionLocal() as db:
            seed_if_empty(db)
    yield


app = FastAPI(title="Спортивный клуб", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def validation_error_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, content={"detail": _validation_message(exc)})


app.include_router(api_router)


if FRONTEND_DIST.is_dir():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")

    @app.get("/{path:path}", include_in_schema=False)
    def spa(path: str):
        if path.startswith("api/"):
            return JSONResponse(status_code=status.HTTP_404_NOT_FOUND, content={"detail": "Не найдено"})
        file = (FRONTEND_DIST / path).resolve()
        if path and file.is_file() and file.is_relative_to(FRONTEND_DIST.resolve()):
            return FileResponse(file)
        # Клиентский роутинг: любой неизвестный путь отдаёт index.html
        return FileResponse(FRONTEND_DIST / "index.html")
