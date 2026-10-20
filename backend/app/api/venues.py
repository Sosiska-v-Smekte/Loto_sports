from datetime import datetime

from fastapi import APIRouter, status

from app.deps import CurrentUser, Db, OptionalUser
from app.schemas.venues import Availability, VenueIn, VenueOut, ZoneIn
from app.services import venues as service

router = APIRouter(tags=["venues"])


def _out(venue, viewer) -> VenueOut:
    out = VenueOut.model_validate(venue)
    out.can_manage = service.can_manage_venue(venue, viewer)
    return out


@router.get("/venues", response_model=list[VenueOut])
def venues(db: Db, viewer: OptionalUser, city: str | None = None):
    return [_out(v, viewer) for v in service.list_venues(db, city)]


@router.post("/venues", response_model=VenueOut, status_code=status.HTTP_201_CREATED)
def create(data: VenueIn, db: Db, user: CurrentUser):
    return _out(service.create_venue(db, data, user), user)


@router.post("/venues/{venue_id}/zones", response_model=VenueOut, status_code=status.HTTP_201_CREATED)
def add_zone(venue_id: int, data: ZoneIn, db: Db, user: CurrentUser):
    return _out(service.add_zone(db, venue_id, data, user), user)


@router.delete("/zones/{zone_id}", response_model=VenueOut)
def remove_zone(zone_id: int, db: Db, user: CurrentUser):
    return _out(service.remove_zone(db, zone_id, user), user)


@router.get("/zones/{zone_id}/availability", response_model=Availability)
def availability(zone_id: int, starts_at: datetime, ends_at: datetime, db: Db):
    return service.availability(db, service.get_zone(db, zone_id), starts_at, ends_at)
