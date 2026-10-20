from fastapi import APIRouter

from app.api import (
    admin,
    auth,
    cities,
    comments,
    events,
    interests,
    notifications,
    organizations,
    participations,
    sports,
    uploads,
    users,
    venues,
)

api_router = APIRouter(prefix="/api")
for module in (auth, cities, sports, events, participations, comments, organizations, users, notifications, uploads, interests, venues, admin):
    api_router.include_router(module.router)
