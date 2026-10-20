from fastapi import APIRouter, status

from app.deps import CurrentUser, Db, OptionalUser
from app.schemas.events import (
    EventOut,
    MyParticipationOut,
    ParticipantOut,
    ParticipantsOut,
)
from app.services import participations as service
from app.services.events import organized_by, present_events

router = APIRouter(tags=["participations"])


@router.post("/events/{event_id}/join", response_model=ParticipantOut, status_code=status.HTTP_201_CREATED)
def join(event_id: int, db: Db, user: CurrentUser):
    return service.join_event(db, event_id, user)


@router.get("/events/{event_id}/participants", response_model=ParticipantsOut)
def participants(event_id: int, db: Db, viewer: OptionalUser):
    return service.list_participants(db, event_id, viewer)


@router.post("/participations/{participation_id}/approve", response_model=ParticipantOut)
def approve(participation_id: int, db: Db, user: CurrentUser):
    return service.decide(db, participation_id, user, approve=True)


@router.post("/participations/{participation_id}/reject", response_model=ParticipantOut)
def reject(participation_id: int, db: Db, user: CurrentUser):
    return service.decide(db, participation_id, user, approve=False)


@router.get("/me/participations", response_model=list[MyParticipationOut])
def my_participations(db: Db, user: CurrentUser):
    rows = service.my_participations(db, user)
    events = present_events(db, [p.event for p in rows], user)
    return [
        MyParticipationOut(id=p.id, status=p.status, created_at=p.created_at, decided_at=p.decided_at, event=event)
        for p, event in zip(rows, events, strict=True)
    ]


@router.post("/me/participations/{participation_id}/hide", status_code=status.HTTP_204_NO_CONTENT)
def hide_participation(participation_id: int, db: Db, user: CurrentUser):
    service.hide_for_user(db, participation_id, user)


@router.delete("/me/participations/{participation_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_participation(participation_id: int, db: Db, user: CurrentUser):
    service.cancel(db, participation_id, user)


@router.get("/me/events", response_model=list[EventOut])
def my_events(db: Db, user: CurrentUser):
    return present_events(db, organized_by(db, user), user)
