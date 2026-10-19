from typing import Annotated

from fastapi import Depends, Header
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import User
from app.services.auth import user_by_token
from app.services.errors import forbidden, unauthorized

Db = Annotated[Session, Depends(get_db)]


def bearer_token(authorization: Annotated[str | None, Header()] = None) -> str | None:
    if authorization and authorization.lower().startswith("bearer "):
        return authorization[7:].strip() or None
    return None


Token = Annotated[str | None, Depends(bearer_token)]


def optional_user(db: Db, token: Token) -> User | None:
    return user_by_token(db, token) if token else None


def current_user(user: Annotated[User | None, Depends(optional_user)]) -> User:
    if user is None:
        raise unauthorized()
    return user


def require_admin(user: Annotated[User, Depends(current_user)]) -> User:
    if not user.is_admin:
        raise forbidden("Это действие доступно только администратору")
    return user


OptionalUser = Annotated[User | None, Depends(optional_user)]
CurrentUser = Annotated[User, Depends(current_user)]
AdminUser = Annotated[User, Depends(require_admin)]
