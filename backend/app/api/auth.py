from fastapi import APIRouter, status

from app.deps import CurrentUser, Db, Token
from app.schemas.users import AuthOut, DemoAccount, LoginIn, RegisterIn, UserOut
from app.seed import DEMO_ACCOUNTS, DEMO_PASSWORD, USERS
from app.services import auth as service

router = APIRouter(prefix="/auth", tags=["auth"])

_NAMES = {email: name for email, name, *_ in USERS}


@router.post("/login", response_model=AuthOut)
def login(data: LoginIn, db: Db):
    token, user = service.login(db, data.email, data.password)
    return AuthOut(token=token, user=UserOut.model_validate(user))


@router.post("/register", response_model=AuthOut, status_code=status.HTTP_201_CREATED)
def register(data: RegisterIn, db: Db):
    token, user = service.register(db, data)
    return AuthOut(token=token, user=UserOut.model_validate(user))


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(db: Db, token: Token):
    if token:
        service.logout(db, token)


@router.get("/me", response_model=UserOut)
def me(user: CurrentUser):
    return user


@router.get("/demo-accounts", response_model=list[DemoAccount])
def demo_accounts():
    return [
        DemoAccount(email=email, password=DEMO_PASSWORD, name=_NAMES[email], role=role, description=description)
        for email, role, description in DEMO_ACCOUNTS
    ]
