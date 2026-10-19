from fastapi import APIRouter

from app.deps import Db
from app.schemas.common import SportOut
from app.services.sports import list_sports

router = APIRouter(prefix="/sports", tags=["sports"])


@router.get("", response_model=list[SportOut])
def sports(db: Db, q: str | None = None):
    return list_sports(db, q)
