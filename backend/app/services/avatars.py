"""Аватарки приходят строкой data:image/...;base64 и хранятся файлами на диске."""

import base64
import binascii
import re
import uuid
from pathlib import Path

from app import config
from app.services.errors import bad_request

MAX_BYTES = 512 * 1024
PUBLIC_PREFIX = "/api/uploads/avatars/"
FILE_NAME = re.compile(r"^[0-9a-f]{32}\.(jpg|png|webp)$")
_DATA_URL = re.compile(r"^data:image/(?:jpeg|png|webp);base64,(?P<body>[A-Za-z0-9+/=\s]+)$")


def _folder() -> Path:
    folder = config.UPLOADS_DIR / "avatars"
    folder.mkdir(parents=True, exist_ok=True)
    return folder


def _extension(data: bytes) -> str | None:
    """Тип определяется по сигнатуре файла: заявленному в строке типу доверять нельзя."""
    if data.startswith(b"\xff\xd8\xff"):
        return "jpg"
    if data.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "webp"
    return None


def save(image: str) -> str:
    match = _DATA_URL.match(image.strip())
    if not match:
        raise bad_request("Загрузите картинку в формате JPEG, PNG или WebP")
    try:
        data = base64.b64decode(match["body"], validate=False)
    except (binascii.Error, ValueError) as error:
        raise bad_request("Не удалось прочитать картинку") from error
    if len(data) > MAX_BYTES:
        raise bad_request("Картинка слишком большая: до 500 КБ")
    extension = _extension(data)
    if extension is None:
        raise bad_request("Загрузите картинку в формате JPEG, PNG или WebP")
    name = f"{uuid.uuid4().hex}.{extension}"
    (_folder() / name).write_bytes(data)
    return f"{PUBLIC_PREFIX}{name}"


def remove(url: str | None) -> None:
    """Удаляет файл прежней аватарки; внешние адреса из демо-данных пропускаются."""
    if not url or not url.startswith(PUBLIC_PREFIX):
        return
    name = url.removeprefix(PUBLIC_PREFIX)
    if FILE_NAME.match(name):
        (_folder() / name).unlink(missing_ok=True)


def path_of(name: str) -> Path | None:
    if not FILE_NAME.match(name):
        return None
    file = _folder() / name
    return file if file.is_file() else None
