from fastapi import APIRouter

from app.services.cities import all_cities, city_centers

router = APIRouter(prefix="/cities", tags=["cities"])


@router.get("", response_model=list[str])
def cities():
    return all_cities()


@router.get("/centers", response_model=dict[str, tuple[float, float]])
def centers():
    """Центр каждого города — куда смотрит карта, если в городе ещё нет мероприятий."""
    return city_centers()
