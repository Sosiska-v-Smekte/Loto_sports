from typing import Annotated

from pydantic import AfterValidator, BaseModel, ConfigDict, EmailStr, StringConstraints

from app.services.cities import check_city

City = Annotated[str, StringConstraints(strip_whitespace=True), AfterValidator(check_city)]


def _ascii_lower(email: str) -> str:
    # email-validator допускает кириллические домены (IDN), но адреса без punycode не принимаются
    if not email.isascii():
        raise ValueError("Введите корректный email")
    return email.lower()


# EmailStr проверяет формат без DNS-запросов, поэтому работает офлайн
Email = Annotated[EmailStr, AfterValidator(_ascii_lower)]


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class UserBrief(ORMModel):
    id: int
    name: str
    avatar_url: str | None


class SportOut(ORMModel):
    id: int
    name: str
    slug: str | None
    color: str
    icon: str
    is_custom: bool


class OrganizationBrief(ORMModel):
    id: int
    name: str
    status: str


class ReasonIn(BaseModel):
    reason: Annotated[str, StringConstraints(strip_whitespace=True, min_length=3, max_length=500)]
