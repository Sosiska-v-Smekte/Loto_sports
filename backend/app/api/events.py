from datetime import date

from fastapi import APIRouter, status

from app.deps import CurrentUser, Db, OptionalUser
from app.schemas.events import EventCreate, EventOut
from app.services import events as service
from app.services.access import get_event_for_viewer

router = APIRouter(prefix="/events", tags=["events"])


@router.get("", response_model=list[EventOut])
def search(
    db: Db,
    viewer: OptionalUser,
    q: str | None = None,
    city: str | None = None,
    date: date | None = None,
    sport_id: int | None = None,
):
    events = service.search_events(db, query=q, city=city, day=date, sport_id=sport_id)
    return service.present_events(db, events, viewer)


@router.get("/featured", response_model=EventOut | None)
def featured(db: Db, viewer: OptionalUser, city: str | None = None):
    event = service.featured_event(db, city)
    return service.present_events(db, [event], viewer)[0] if event else None


@router.get("/cities", response_model=list[str])
def cities(db: Db):
    return service.list_cities(db)


@router.post("", response_model=EventOut, status_code=status.HTTP_201_CREATED)
def create(data: EventCreate, db: Db, user: CurrentUser):
    event = service.create_event(db, data, user)
    return service.present_events(db, [event], user)[0]


@router.get("/{event_id}", response_model=EventOut)
def get(event_id: int, db: Db, viewer: OptionalUser):
    event = get_event_for_viewer(db, event_id, viewer)
    return service.present_events(db, [event], viewer)[0]
