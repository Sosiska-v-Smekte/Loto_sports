from fastapi import APIRouter
from fastapi.responses import FileResponse

from app.services import avatars
from app.services.errors import not_found

router = APIRouter(tags=["uploads"])


@router.get("/uploads/avatars/{name}", include_in_schema=False)
def avatar_file(name: str):
    file = avatars.path_of(name)
    if file is None:
        raise not_found("Файл не найден")
    # Имя файла случайное и не меняется, поэтому браузер может кэшировать надолго
    return FileResponse(file, headers={"Cache-Control": "public, max-age=31536000, immutable"})
