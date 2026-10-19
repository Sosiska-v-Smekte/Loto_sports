from fastapi import APIRouter

from app.services.cities import all_cities

router = APIRouter(prefix="/cities", tags=["cities"])


@router.get("", response_model=list[str])
def cities():
    return all_cities()
