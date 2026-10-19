from fastapi import APIRouter

from app.api import admin, auth, cities, comments, events, organizations, participations, sports, users

api_router = APIRouter(prefix="/api")
for module in (auth, cities, sports, events, participations, comments, organizations, users, admin):
    api_router.include_router(module.router)
