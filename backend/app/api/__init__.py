from fastapi import APIRouter

from app.api import admin, auth, cities, comments, events, notifications, organizations, participations, sports, uploads, users

api_router = APIRouter(prefix="/api")
for module in (auth, cities, sports, events, participations, comments, organizations, users, notifications, uploads, admin):
    api_router.include_router(module.router)
