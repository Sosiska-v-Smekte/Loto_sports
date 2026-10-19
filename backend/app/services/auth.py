from sqlalchemy import delete, func, select
from sqlalchemy.orm import Session

from app.models import AuthSession, User
from app.schemas.users import RegisterIn
from app.services.errors import conflict, unauthorized
from app.services.security import hash_password, new_token, verify_password


def _open_session(db: Session, user: User) -> str:
    token = new_token()
    db.add(AuthSession(token=token, user_id=user.id))
    db.commit()
    return token


def _find_by_email(db: Session, email: str) -> User | None:
    # Email уникален без учёта регистра: «Anna@Mail.ru» и «anna@mail.ru» — один пользователь
    return db.scalar(select(User).where(func.lower(User.email) == email.strip().lower()))


def login(db: Session, email: str, password: str) -> tuple[str, User]:
    user = _find_by_email(db, email)
    if user is None or not verify_password(password, user.password_hash):
        raise unauthorized("Неверный email или пароль")
    return _open_session(db, user), user


def register(db: Session, data: RegisterIn) -> tuple[str, User]:
    if _find_by_email(db, data.email) is not None:
        raise conflict("Пользователь с таким email уже зарегистрирован")
    user = User(name=data.name, email=data.email, city=data.city, password_hash=hash_password(data.password))
    db.add(user)
    db.flush()
    return _open_session(db, user), user


def logout(db: Session, token: str) -> None:
    db.execute(delete(AuthSession).where(AuthSession.token == token))
    db.commit()


def user_by_token(db: Session, token: str) -> User | None:
    session = db.get(AuthSession, token)
    return session.user if session else None
