from fastapi import APIRouter, status

from app.deps import CurrentUser, Db, OptionalUser
from app.schemas.interests import DemandGroup, InterestIn, InterestOut
from app.services import interests as service

router = APIRouter(prefix="/interests", tags=["interests"])


@router.get("/demand", response_model=list[DemandGroup])
def demand(db: Db, viewer: OptionalUser, city: str | None = None):
    return service.demand(db, city, viewer)


@router.get("/mine", response_model=list[InterestOut])
def mine(db: Db, user: CurrentUser):
    return service.mine(db, user)


@router.post("", response_model=list[InterestOut], status_code=status.HTTP_201_CREATED)
def add(data: InterestIn, db: Db, user: CurrentUser):
    return service.add_interests(db, data, user)


@router.delete("/{interest_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove(interest_id: int, db: Db, user: CurrentUser):
    service.remove(db, interest_id, user)
