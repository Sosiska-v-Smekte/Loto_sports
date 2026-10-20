from typing import Annotated

from pydantic import BaseModel, Field, StringConstraints, model_validator

from app.models import DayKind, DayPart
from app.schemas.common import City, ORMModel, SportOut


class InterestIn(BaseModel):
    sport_id: int | None = None
    # Своё направление, как при создании мероприятия: появится в каталоге и будет доступно всем
    sport_name: Annotated[str, StringConstraints(strip_whitespace=True, max_length=60)] | None = None
    city: City
    district: Annotated[str, StringConstraints(strip_whitespace=True, max_length=80)] = ""
    day_kinds: Annotated[list[DayKind], Field(min_length=1, max_length=2)]
    day_parts: Annotated[list[DayPart], Field(min_length=1, max_length=3)]

    @model_validator(mode="after")
    def _check(self) -> "InterestIn":
        if not self.sport_id and not self.sport_name:
            raise ValueError("Выберите направление или впишите своё")
        return self


class InterestOut(ORMModel):
    id: int
    sport: SportOut
    city: str
    district: str
    day_kind: str
    day_part: str


class DemandGroup(BaseModel):
    """Совместимые намерения: то же направление, город, будни/выходные и время суток."""

    sport: SportOut
    city: str
    day_kind: str
    day_part: str
    # Сколько человек хотят пойти, включая зрителя, если он среди них
    count: int
    mine: bool
    districts: list[str]
