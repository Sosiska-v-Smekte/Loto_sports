from fastapi import APIRouter, status

from app.deps import CurrentUser, Db, OptionalUser
from app.schemas.organizations import OrganizationIn, OrganizationOut, OrganizationPage
from app.schemas.users import AvatarIn
from app.services import organizations as service
from app.services.events import present_events, upcoming_by_organization

router = APIRouter(tags=["organizations"])


@router.get("/organizations", response_model=list[OrganizationOut])
def list_organizations(db: Db, viewer: OptionalUser, q: str | None = None):
    return service.present(db, service.list_approved(db, q), viewer)


@router.get("/organizations/{organization_id}", response_model=OrganizationPage)
def organization_page(organization_id: int, db: Db, viewer: OptionalUser):
    organization = service.get_public(db, organization_id)
    events = present_events(db, upcoming_by_organization(db, organization.id), viewer)
    return OrganizationPage(organization=service.present(db, [organization], viewer)[0], events=events)


@router.get("/me/organization", response_model=OrganizationOut | None)
def my_organization(db: Db, user: CurrentUser):
    return service.get_own(db, user)


@router.post("/me/organization", response_model=OrganizationOut, status_code=status.HTTP_201_CREATED)
def submit_organization(data: OrganizationIn, db: Db, user: CurrentUser):
    return service.submit(db, user, data)


@router.put("/me/organization/avatar", response_model=OrganizationOut)
def upload_organization_avatar(data: AvatarIn, db: Db, user: CurrentUser):
    return service.set_avatar(db, user, data.image)


@router.delete("/me/organization/avatar", response_model=OrganizationOut)
def delete_organization_avatar(db: Db, user: CurrentUser):
    return service.set_avatar(db, user, None)


@router.post("/organizations/{organization_id}/join", response_model=OrganizationOut)
def join_organization(organization_id: int, db: Db, user: CurrentUser):
    organization = service.join(db, organization_id, user)
    return service.present(db, [organization], user)[0]


@router.delete("/organizations/{organization_id}/join", response_model=OrganizationOut)
def leave_organization(organization_id: int, db: Db, user: CurrentUser):
    organization = service.leave(db, organization_id, user)
    return service.present(db, [organization], user)[0]
