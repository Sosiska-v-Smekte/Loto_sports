from typing import Literal

from fastapi import APIRouter

from app.deps import AdminUser, Db
from app.models import EventStatus
from app.schemas.common import ReasonIn
from app.schemas.events import CommentOut, EventOut
from app.schemas.organizations import AdminOrganizationOut, OrganizationOut
from app.services import admin as service
from app.services.comments import hide_comment
from app.services.events import present_events

router = APIRouter(prefix="/admin", tags=["admin"])

OrgStatus = Literal["pending", "approved", "rejected"]
EvStatus = Literal["published", "unpublished", "deleted"]


@router.get("/organizations", response_model=list[AdminOrganizationOut])
def organizations(_: AdminUser, db: Db, status: OrgStatus | None = None, q: str | None = None):
    return service.list_organizations(db, status, q)


@router.post("/organizations/{organization_id}/approve", response_model=OrganizationOut)
def approve_organization(organization_id: int, _: AdminUser, db: Db):
    return service.review_organization(db, organization_id, approve=True, reason=None)


@router.post("/organizations/{organization_id}/reject", response_model=OrganizationOut)
def reject_organization(organization_id: int, data: ReasonIn, _: AdminUser, db: Db):
    return service.review_organization(db, organization_id, approve=False, reason=data.reason)


@router.get("/events", response_model=list[EventOut])
def events(
    admin: AdminUser,
    db: Db,
    status: EvStatus | None = None,
    q: str | None = None,
    organization_id: int | None = None,
    organizer_id: int | None = None,
):
    return present_events(db, service.list_events(db, status, q, organization_id, organizer_id), admin)


@router.post("/events/{event_id}/unpublish", response_model=EventOut)
def unpublish_event(event_id: int, data: ReasonIn, admin: AdminUser, db: Db):
    event = service.moderate_event(db, event_id, EventStatus.unpublished, data.reason)
    return present_events(db, [event], admin)[0]


@router.post("/events/{event_id}/delete", response_model=EventOut)
def delete_event(event_id: int, data: ReasonIn, admin: AdminUser, db: Db):
    event = service.moderate_event(db, event_id, EventStatus.deleted, data.reason)
    return present_events(db, [event], admin)[0]


@router.post("/comments/{comment_id}/hide", response_model=CommentOut)
def hide(comment_id: int, data: ReasonIn, admin: AdminUser, db: Db):
    return hide_comment(db, comment_id, admin, data.reason)
