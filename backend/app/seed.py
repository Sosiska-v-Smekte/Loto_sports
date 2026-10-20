"""Демо-данные. Все даты считаются от текущего момента, чтобы демо не устаревало.

Запуск: python -m app.seed [--reset]
"""

import argparse
import sys
from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db import Base, SessionLocal, engine, init_db
from app.models import (
    Comment,
    DayKind,
    DayPart,
    Event,
    EventLevel,
    Interest,
    OrganizationMember,
    EventStatus,
    JoinMode,
    Organization,
    OrganizationStatus,
    Participation,
    ParticipationStatus,
    Sport,
    SportLevel,
    User,
    UserSport,
    Venue,
    Zone,
)
from app.models.base import now
from app.services.notifications import (
    notify_decision,
    notify_event_unpublished,
    notify_organization_request,
    notify_organization_review,
    notify_reply,
)
from app.services.security import hash_password
from app.services.sports import ensure_base_sports, get_or_create_sport

DEMO_PASSWORD = "demo1234"

# email, имя, город, о себе, админ
USERS = [
    ("user@demo.ru", "Илья С.", "Москва", "Играю в футбол по выходным, ищу компанию на теннис.", False),
    ("user2@demo.ru", "Анна И.", "Москва", "Теннис, йога и утренние пробежки.", False),
    ("org@demo.ru", "Олег К.", "Москва", "Руковожу шахматным клубом «Ход».", False),
    ("neworg@demo.ru", "Мария П.", "Москва", "Хочу собрать сообщество любителей скандинавской ходьбы.", False),
    ("pending@demo.ru", "Дмитрий В.", "Москва", "Организую пляжный волейбол.", False),
    ("admin@demo.ru", "Администратор", "Москва", "Модерация платформы.", True),
    ("ivan@demo.ru", "Иван Г.", "Москва", "Бегаю и играю в стритбол.", False),
    ("sergey@demo.ru", "Сергей Н.", "Санкт-Петербург", "Тренер по функциональному тренингу.", False),
]

# Подписи для блока «Демо-доступ» на экране входа
DEMO_ACCOUNTS = [
    ("user@demo.ru", "Пользователь", "Создаёт мероприятия и записывается на них"),
    ("user2@demo.ru", "Пользователь", "Второй участник, подаёт заявки"),
    ("org@demo.ru", "Организация", "Владелец одобренного шахматного клуба «Ход»"),
    ("neworg@demo.ru", "Новая организация", "Пока без организации — может подать заявку"),
    ("pending@demo.ru", "Организация на проверке", "Заявка ждёт решения администратора"),
    ("admin@demo.ru", "Администратор", "Модерация организаций, мероприятий и обсуждений"),
]


# Координаты демо-площадок для карты: найдены геокодером OpenStreetMap (Nominatim) по адресу из карточки
PLACE_COORDINATES: dict[str, tuple[float, float]] = {
    "Остров Татышев, центральная аллея": (56.028895, 92.945143),
    "Стадион «Центральный», остров Отдыха, 15": (55.996649, 92.88345),
    "Театральная площадь, у фонтана": (56.008756, 92.870299),
    "Краевая научная библиотека, ул. Карла Маркса, 114": (56.010185, 92.855199),
    "Центральный парк, ул. Карла Маркса, 151": (56.007707, 92.853051),
    "Набережная Енисея у Коммунального моста": (55.996552, 92.879007),
    "Базаиха, ул. Сибирская, 92": (55.961469, 92.795115),
    "Академгородок, 50": (55.991834, 92.765168),
    "Сквер Космонавтов, ул. Взлётная": (56.055469, 92.967995),
    "Стадион «Авангард», ул. Академика Павлова, 21/1": (55.994671, 92.962894),
    "Арена «Север», ул. 9 Мая, 74": (56.050787, 92.894608),
    "Николаевский проспект, сквер у Николаевского моста": (55.983631, 92.812124),
    "Парк Горького, Крымский Вал, 9": (55.730032, 37.608461),
    "Крымский Вал, 9": (55.730032, 37.608461),
    "Лужнецкая наб., 24": (55.715, 37.553),
    "ул. Остоженка, 7": (55.7415, 37.5985),
    "Ленинградский пр., 33": (55.7905, 37.5535),
    "Манеж «Запад», ул. Генерала Дорохова, 10": (55.70235, 37.440067),
    "СК «Спартак», Майская аллея, 7": (55.7929, 37.6764),
    "Клуб «Ход», ул. Покровка, 17": (55.759704, 37.64527),
    "Лужники, площадка у Малой спортивной арены": (55.718317, 37.549332),
    "Двор на Фрунзенской набережной, 30": (55.725058, 37.582543),
    "Парк Сокольники, у главного входа": (55.799529, 37.671629),
    "Парк «Музеон», крытые песчаные корты": (55.735392, 37.607342),
    "Клуб «Топспин», ул. Бауманская, 50": (55.769562, 37.679116),
    "Бассейн «Чайка», Турчанинов пер., 3": (55.736244, 37.597496),
    "Старт у Крымского моста": (55.734001, 37.598962),
    "Стадион «Красная Пресня», ул. Мантулинская, 5": (55.753179, 37.553868),
    "Парк «Музеон», лужайка у набережной": (55.73329, 37.600025),
    "Теннисный центр «Жуковка», Рублёво-Успенское ш.": (55.7399, 37.250733),
    "Стадион «Авангард», ул. Чкалова, 4": (55.764014, 37.656257),
    "Площадь Революции": (55.756651, 37.621784),
    "Елагин остров, у Масляного луга": (59.978844, 30.258828),
    "Крестовский остров, мини-поле у метро": (59.970754, 30.258749),
    "Летний сад, павильон у Карпиева пруда": (59.944287, 30.335792),
    "Парк «Музеон», Крымский Вал, 2": (55.733489, 37.605655),
    "Боулинг-клуб «Страйк», ул. Арбат, 24": (55.750113, 37.592109),
    "Зал «Ринг», Ленинский проспект, 30": (55.710785, 37.584884),
    "Ледовая арена «Сокольники», ул. Сокольнический Вал, 1Б": (55.792894, 37.671492),
}


def _at(days: int, hour: int, minute: int = 0) -> datetime:
    """Дата через `days` дней в hh:mm.

    Если сид запускают вечером и сегодняшнее время уже прошло, событие переносится на ближайший
    час сегодня (не позже 22:00), а если и это невозможно — на завтра в то же время.
    """
    current = now()
    moment = (current + timedelta(days=days)).replace(hour=hour, minute=minute, second=0)
    if moment >= current + timedelta(hours=1):
        return moment
    later_today = current.replace(minute=minute, second=0) + timedelta(hours=2)
    if later_today.date() == current.date() and later_today.hour <= 22:
        return later_today
    return moment + timedelta(days=1)


def seed(db: Session) -> None:
    ensure_base_sports(db)
    sports = {s.slug: s for s in db.scalars(select(Sport)) if s.slug}

    users: dict[str, User] = {}
    for email, name, city, about, is_admin in USERS:
        user = User(
            email=email,
            name=name,
            city=city,
            about=about,
            is_admin=is_admin,
            password_hash=hash_password(DEMO_PASSWORD),
        )
        db.add(user)
        users[email] = user
    db.flush()

    ilya, anna, oleg, maria = users["user@demo.ru"], users["user2@demo.ru"], users["org@demo.ru"], users["neworg@demo.ru"]
    ivan, dmitry, sergey = users["ivan@demo.ru"], users["pending@demo.ru"], users["sergey@demo.ru"]

    hod = Organization(
        owner_id=oleg.id,
        name="Шахматный клуб «Ход»",
        description=(
            "Клуб для всех, кто любит шахматы: от тех, кто только выучил ходы, до разрядников. "
            "Собираемся по вечерам будних дней, доски и часы есть на месте."
        ),
        sports="Шахматы",
        city="Москва",
        contacts="+7 (495) 123-45-67, hod-chess@example.ru",
        status=OrganizationStatus.approved,
        reviewed_at=now() - timedelta(days=30),
    )
    beach = Organization(
        owner_id=dmitry.id,
        name="Волейбольное сообщество «Пляж»",
        description="Пляжный волейбол летом и в крытых залах зимой. Играем 2×2 и 4×4.",
        sports="Волейбол",
        city="Москва",
        contacts="@beach_volley_msk",
        status=OrganizationStatus.pending,
    )
    pulse = Organization(
        owner_id=sergey.id,
        name="Фитнес-клуб «Пульс»",
        description="Функциональные тренировки.",
        sports="Функциональный тренинг",
        city="Санкт-Петербург",
        contacts="",
        status=OrganizationStatus.rejected,
        rejection_reason="Не указаны контакты и адрес площадки. Добавьте их и отправьте заявку снова.",
        reviewed_at=now() - timedelta(days=2),
    )
    db.add_all([hod, beach, pulse])
    db.flush()

    nordic = get_or_create_sport(db, "Скандинавская ходьба", maria)

    def ev(title, sport, organizer, starts_at, address, *, city="Москва", org=None, level=EventLevel.any,
           mode=JoinMode.open, description="", place="", requirements="", hours=2, color=None, pattern=None):
        event = Event(
            title=title,
            description=description,
            sport_id=sport.id,
            organizer_user_id=organizer.id,
            organization_id=org.id if org else None,
            starts_at=starts_at,
            ends_at=starts_at + timedelta(hours=hours),
            city=city,
            address=address,
            place_details=place,
            latitude=PLACE_COORDINATES.get(address, (None, None))[0],
            longitude=PLACE_COORDINATES.get(address, (None, None))[1],
            level=level,
            requirements=requirements,
            join_mode=mode,
            card_color=color,
            card_pattern=pattern,
        )
        db.add(event)
        return event

    run_gorky = ev(
        "Вечерний забег в Парке Горького", sports["running"], ivan, _at(0, 19),
        "Парк Горького, Крымский Вал, 9",
        pattern="track",
        description="Лёгкая пробежка 5 км вдоль набережной. Темп разговорный, никого не бросаем.",
        place="Встречаемся у главного входа, возле арки.",
        requirements="Удобная обувь для бега, вода.", hours=1,
    )
    football = ev(
        "Любительский матч 5x5", sports["football"], ilya, _at(0, 19, 30),
        "Манеж «Запад», ул. Генерала Дорохова, 10",
        pattern="pitch",
        description="Играем в мини-футбол два тайма по 25 минут. Команды делим на месте.",
        place="Поле №2, вход со стороны парковки.",
        requirements="Сменная обувь для зала (сороконожки или футзалки). Манишки выдадим.",
    )
    tennis_pair = ev(
        "Парный турнир на грунте", sports["tennis"], anna, _at(1, 12),
        "СК «Спартак», Майская аллея, 7",
        pattern="tennis",
        level=EventLevel.amateur, mode=JoinMode.approval,
        description="Небольшой парный турнир, играем до 6 геймов. Пары составим по уровню.",
        place="Грунтовые корты 3 и 4.",
        requirements="Своя ракетка. Уверенная подача и опыт игры от года.", hours=4,
    )
    blitz = ev(
        "Вечер быстрых шахмат", sports["chess"], oleg, _at(2, 18, 30),
        "Клуб «Ход», ул. Покровка, 17",
        pattern="chess",
        org=hod, mode=JoinMode.approval,
        description="Играем блиц 5+3 по швейцарской системе, 7 туров. Подходит всем уровням.",
        place="Второй этаж, зал с большими окнами.",
        requirements="Ничего не нужно: доски и часы есть в клубе.", hours=3,
    )
    streetball = ev(
        "Стритбол в Лужниках", sports["basketball"], ivan, _at(4, 16),
        "Лужники, площадка у Малой спортивной арены",
        pattern="court",
        level=EventLevel.beginner,
        description="Играем 3×3 на одно кольцо до 21 очка. Новичкам объясним правила.",
        requirements="Кроссовки и вода. Мяч есть.",
    )
    chess_beginners = ev(
        "Шахматы для начинающих", sports["chess"], oleg, _at(6, 19),
        "Клуб «Ход», ул. Покровка, 17",
        org=hod, level=EventLevel.beginner, mode=JoinMode.approval,
        description="Разбираем дебюты и играем партии с тренером. Подходит тем, кто знает, как ходят фигуры.",
    )
    ev(
        "Бадминтон в Музеоне", sports["badminton"], anna, _at(2, 17),
        "Парк «Музеон», Крымский Вал, 2",
        description="Играем на открытой площадке у набережной, ракетки и воланы есть на всех.",
        requirements="Удобная обувь и вода.",
    )
    ev(
        "Боулинг после работы", sports["bowling"], ilya, _at(3, 20),
        "Боулинг-клуб «Страйк», ул. Арбат, 24",
        description="Две дорожки, играем две игры. Счёт ведём для интереса, новичкам покажем, как бросать.",
        place="Дорожки 5 и 6, бронь на имя Ильи.",
        requirements="Обувь выдают в клубе.",
    )
    ev(
        "Бокс: тренировка для новичков", sports["boxing"], ivan, _at(5, 10),
        "Зал «Ринг», Ленинский проспект, 30",
        level=EventLevel.beginner, mode=JoinMode.approval,
        description="Стойка, удары, работа на лапах. Без спаррингов, только техника и общая физподготовка.",
        requirements="Спортивная форма, бинты. Перчатки дадим в зале.", hours=1,
    )
    ev(
        "Любительский хоккей", sports["hockey"], ilya, _at(7, 21, 30),
        "Ледовая арена «Сокольники», ул. Сокольнический Вал, 1Б",
        level=EventLevel.amateur,
        description="Ночной лёд, играем 5×5 без силовых приёмов. Делимся на две команды на месте.",
        requirements="Полная хоккейная экипировка обязательна.", hours=1,
    )
    autumn_cup = ev(
        "Блиц-турнир «Осенний ход»", sports["chess"], oleg, _at(9, 12),
        "Клуб «Ход», ул. Покровка, 17",
        org=hod, level=EventLevel.amateur, mode=JoinMode.approval,
        description="Турнир клуба для любителей. Победителю — кубок и годовой абонемент.", hours=5,
    )
    morning = ev(
        "Утренняя зарядка во дворе", sports["yoga"], anna, _at(1, 8),
        "Двор на Фрунзенской набережной, 30",
        color="#9FD8F0", pattern="waves",
        description="20 минут лёгкой разминки на свежем воздухе. Подходит любому возрасту.",
        requirements="Удобная одежда. Коврик по желанию.", hours=1,
    )
    nordic_walk = ev(
        "Скандинавская ходьба в Сокольниках", nordic, maria, _at(3, 10),
        "Парк Сокольники, у главного входа",
        description="Неспешная прогулка 6 км с палками. Покажем технику, палки можно взять на время.",
        requirements="Удобная обувь, одежда по погоде.",
    )
    volleyball = ev(
        "Волейбол на песке", sports["volleyball"], ivan, _at(5, 18),
        "Парк «Музеон», крытые песчаные корты",
        color="#F7B267", pattern="net",
        level=EventLevel.amateur,
        description="Игра 4×4, меняемся составами каждые 15 минут.",
    )
    table_tennis = ev(
        "Настольный теннис после работы", sports["table-tennis"], ilya, _at(7, 19, 30),
        "Клуб «Топспин», ул. Бауманская, 50",
        level=EventLevel.amateur, mode=JoinMode.approval,
        description="Играем на вылет, потом парные игры. Столов четыре, поэтому собираю заявки.",
        requirements="Своя ракетка, если есть. Есть прокат.",
    )
    swim = ev(
        "Заплыв в бассейне «Чайка»", sports["swimming"], anna, _at(8, 7, 30),
        "Бассейн «Чайка», Турчанинов пер., 3",
        pattern="lanes",
        level=EventLevel.beginner,
        description="Спокойно плаваем 45 минут на своей дорожке.",
        requirements="Шапочка, очки, справка для бассейна.", hours=1,
    )
    bike = ev(
        "Велопрогулка по набережной", sports["cycling"], ilya, _at(10, 11),
        "Старт у Крымского моста",
        description="25 км в спокойном темпе до Воробьёвых гор и обратно.",
        requirements="Свой велосипед или прокат, шлем обязателен.", hours=3,
    )
    sunday_football = ev(
        "Футбол по воскресеньям", sports["football"], ivan, _at(13, 10),
        "Стадион «Красная Пресня», ул. Мантулинская, 5",
        level=EventLevel.amateur,
        description="Играем 8×8 на половине поля. Нужна базовая физическая форма.",
    )
    yoga_park = ev(
        "Йога в парке Музеон", sports["yoga"], anna, _at(15, 9),
        "Парк «Музеон», лужайка у набережной",
        description="Мягкая хатха-йога для всех. Если дождь — переносим под навес.",
        requirements="Коврик и плед.", hours=1,
    )
    sparring = ev(
        "Теннис: спарринг для опытных", sports["tennis"], ilya, _at(18, 17),
        "Теннисный центр «Жуковка», Рублёво-Успенское ш.",
        level=EventLevel.pro, mode=JoinMode.approval,
        description="Ищу соперника уровня NTRP 4.0+ на два сета.",
        requirements="Своя ракетка и мячи.",
    )
    intervals = ev(
        "Интервальная тренировка на стадионе", sports["running"], ivan, _at(20, 8),
        "Стадион «Авангард», ул. Чкалова, 4",
        level=EventLevel.pro,
        description="10 × 400 м с отдыхом 200 м трусцой. Для тех, кто регулярно бегает.", hours=1,
    )
    night_run = ev(
        "Ночной забег по центру", sports["running"], ivan, _at(6, 23),
        "Площадь Революции",
        description="Пробежка 10 км по ночному центру Москвы.",
    )
    night_run.status = EventStatus.unpublished
    night_run.moderation_reason = "Маршрут проходит по проезжей части без согласования. Уточните маршрут."

    ev("Пробежка по Елагину острову", sports["running"], sergey, _at(2, 9), "Елагин остров, у Масляного луга",
       city="Санкт-Петербург", description="Круг 5 км по острову в спокойном темпе.", hours=1)
    ev("Футбол на Крестовском", sports["football"], sergey, _at(5, 18), "Крестовский остров, мини-поле у метро",
       city="Санкт-Петербург", level=EventLevel.amateur, description="Играем 6×6, ищем ещё 4 игроков.")
    # Красноярск: адреса в карточках совпадают с точками на карте
    kr = {"city": "Красноярск"}
    ev("Вечерняя пробежка по Татышеву", sports["running"], ivan, _at(0, 19), "Остров Татышев, центральная аллея",
       **kr, description="Круг 5 км по острову в разговорном темпе. Новичков ждём.", requirements="Беговая обувь, вода.", hours=1)
    ev("Футбол на острове Отдыха", sports["football"], ilya, _at(1, 18), "Стадион «Центральный», остров Отдыха, 15",
       **kr, level=EventLevel.amateur, description="Играем 7×7 на искусственном газоне, два тайма по 30 минут.",
       requirements="Бутсы для искусственного газона.")
    ev("Йога у фонтана на Театральной", sports["yoga"], anna, _at(1, 8), "Театральная площадь, у фонтана",
       **kr, description="Мягкая утренняя практика на свежем воздухе, 45 минут.", requirements="Коврик и тёплая кофта.", hours=1)
    ev("Шахматный вечер в библиотеке", sports["chess"], oleg, _at(2, 18, 30), "Краевая научная библиотека, ул. Карла Маркса, 114",
       **kr, mode=JoinMode.approval, description="Партии с контролем 15+10 в читальном зале. Доски и часы дадут на месте.")
    ev("Блиц-турнир в библиотеке", sports["chess"], oleg, _at(4, 18, 30), "Краевая научная библиотека, ул. Карла Маркса, 114",
       **kr, level=EventLevel.amateur, mode=JoinMode.approval, description="Блиц 3+2, швейцарская система, 9 туров.", hours=3)
    ev("Утренняя зарядка в Центральном парке", sports["yoga"], anna, _at(3, 7, 30), "Центральный парк, ул. Карла Маркса, 151",
       **kr, description="Двадцать минут разминки для всех возрастов.", hours=1)
    ev("Велопрогулка по набережной Енисея", sports["cycling"], ilya, _at(5, 11), "Набережная Енисея у Коммунального моста",
       **kr, level=EventLevel.beginner, description="20 км по набережной до Николаевского моста и обратно.",
       requirements="Велосипед и шлем.", hours=3)
    ev("Скандинавская ходьба в Базаихе", nordic, maria, _at(2, 10), "Базаиха, ул. Сибирская, 92",
       **kr, description="Прогулка 6 км с палками по подножию Столбов.", requirements="Палки можно взять напрокат.")
    ev("Теннис в Академгородке", sports["tennis"], anna, _at(6, 17), "Академгородок, 50",
       **kr, level=EventLevel.amateur, mode=JoinMode.approval, description="Парные игры, подберём партнёра по уровню.",
       requirements="Своя ракетка.")
    ev("Стритбол в сквере Космонавтов", sports["basketball"], ivan, _at(4, 18), "Сквер Космонавтов, ул. Взлётная",
       **kr, level=EventLevel.beginner, description="Играем 3×3 до 21 очка. Мяч есть.")
    ev("Интервалы на стадионе «Авангард»", sports["running"], ivan, _at(7, 8), "Стадион «Авангард», ул. Академика Павлова, 21/1",
       **kr, level=EventLevel.pro, description="8 × 400 м через 200 м трусцой.", hours=1)
    ev("Волейбол в «Арене Север»", sports["volleyball"], ivan, _at(8, 19), "Арена «Север», ул. 9 Мая, 74",
       **kr, level=EventLevel.amateur, description="Игра 6×6 в зале, меняемся составами.")
    ev("Настольный теннис у Николаевского моста", sports["table-tennis"], ilya, _at(9, 18), "Николаевский проспект, сквер у Николаевского моста",
       **kr, mode=JoinMode.approval, description="Уличные столы в сквере, играем на вылет.")

    ev("Шахматы в Летнем саду", sports["chess"], sergey, _at(8, 15), "Летний сад, павильон у Карпиева пруда",
       city="Санкт-Петербург", description="Неформальные партии на свежем воздухе. Доски принесём.")
    db.flush()

    def join(event, user, status, days_ago=1):
        participation = Participation(
            event_id=event.id,
            user_id=user.id,
            status=status,
            created_at=now() - timedelta(days=days_ago),
            decided_at=None if status == ParticipationStatus.pending else now() - timedelta(hours=days_ago * 12),
        )
        db.add(participation)
        return participation

    confirmed, pending, rejected = ParticipationStatus.confirmed, ParticipationStatus.pending, ParticipationStatus.rejected
    join(run_gorky, anna, confirmed)
    join(run_gorky, ilya, confirmed)
    join(football, anna, confirmed)
    join(football, ivan, confirmed)
    join(tennis_pair, ilya, pending)
    join(blitz, anna, pending)
    ilya_blitz = join(blitz, ilya, confirmed, days_ago=3)
    join(blitz, ivan, confirmed, days_ago=2)
    join(chess_beginners, anna, pending)
    join(autumn_cup, maria, pending)
    join(autumn_cup, ilya, confirmed)
    join(streetball, ilya, confirmed)
    join(table_tennis, anna, pending)
    ivan_sparring = join(sparring, ivan, rejected, days_ago=2)
    join(morning, maria, confirmed)
    join(nordic_walk, anna, confirmed)
    join(night_run, ilya, confirmed, days_ago=4)

    def say(event, author, text, hours_ago, reply_to=None):
        comment = Comment(
            event_id=event.id,
            author_id=author.id,
            text=text,
            parent_id=reply_to.id if reply_to else None,
            created_at=now() - timedelta(hours=hours_ago),
        )
        db.add(comment)
        db.flush()
        if reply_to is not None:
            notify_reply(db, event, comment, reply_to)
        return comment

    rating = say(blitz, anna, "Здравствуйте! Можно прийти, если у меня нет рейтинга?", 30)
    no_rating = say(blitz, oleg, "Конечно! Рейтинг не нужен, играем все вместе. Доски и часы дадим.", 28, rating)
    say(blitz, anna, "Отлично, спасибо! Тогда жду решения по заявке.", 27, no_rating)
    say(blitz, ivan, "А будет перерыв между турами?", 6)
    bibs = say(football, ivan, "Сколько уже собралось? Нужна ли своя манишка?", 20)
    say(football, ilya, "Пока шестеро. Манишки дадим, приходите за 10 минут до начала.", 19, bibs)
    pace = say(run_gorky, anna, "Какой будет темп? Я только начинаю бегать.", 10)
    say(run_gorky, ivan, "Около 6:30 на километр, будем ждать всех. Приходите!", 9, pace)
    pair = say(tennis_pair, ilya, "Можно подать заявку без пары?", 15)
    say(tennis_pair, anna, "Да, пары составим на месте по уровню.", 14, pair)

    # Уведомления создаются теми же функциями, что и в работе приложения
    db.flush()
    notify_decision(db, ilya_blitz)
    notify_decision(db, ivan_sparring)
    notify_event_unpublished(db, night_run)
    notify_organization_review(db, pulse)
    notify_organization_request(db, beach)

    db.commit()


def seed_planning(db: Session) -> None:
    """Демо площадки с зонами и несколько отметок «Я бы пошёл». Добавляется и в уже заполненную базу."""
    if db.scalar(select(Venue.id).limit(1)) is not None:
        return
    users = {u.email: u for u in db.scalars(select(User))}
    if "org@demo.ru" not in users:
        return
    owner = users["org@demo.ru"]
    organization = db.scalar(select(Organization).where(Organization.owner_id == owner.id))
    sports = {s.slug: s for s in db.scalars(select(Sport)) if s.slug}

    def zone(name, capacity, order, group=None, buffer=0):
        return Zone(name=name, group_name=group, capacity=capacity, buffer_minutes=buffer, sort_order=order)

    db.add(
        Venue(
            name="Спортивный центр «Старт»",
            city="Москва",
            address="ул. Ленина, 10",
            owner_id=owner.id,
            organization_id=organization.id if organization else None,
            zones=[
                zone("Футбольное поле", 22, 0, buffer=15),
                zone("Малый зал", 12, 1, buffer=15),
                zone("Стол №1", 4, 2, "Зал настольного тенниса"),
                zone("Стол №2", 4, 3, "Зал настольного тенниса"),
                zone("Стол №3", 4, 4, "Зал настольного тенниса"),
            ],
        )
    )
    wants = [
        ("user2@demo.ru", "volleyball", DayKind.weekend, DayPart.day, "Центральный"),
        ("ivan@demo.ru", "volleyball", DayKind.weekend, DayPart.day, "Центральный"),
        ("user@demo.ru", "volleyball", DayKind.weekend, DayPart.day, ""),
        ("org@demo.ru", "volleyball", DayKind.weekend, DayPart.day, "Северный"),
        ("neworg@demo.ru", "volleyball", DayKind.weekend, DayPart.day, ""),
        ("user2@demo.ru", "chess", DayKind.weekday, DayPart.evening, ""),
        ("ivan@demo.ru", "chess", DayKind.weekday, DayPart.evening, ""),
    ]
    for email, slug, kind, part, district in wants:
        if email in users and slug in sports:
            db.add(
                Interest(user_id=users[email].id, sport_id=sports[slug].id, city="Москва", district=district, day_kind=kind, day_part=part)
            )
    db.commit()


CLUBS = [
    # email владельца, имя, название, направление, описание, адрес, дни до события, час
    ("run@demo.ru", "Алексей С.", "Беговой клуб Парка Горького", "Бег", "Пробежки по набережной для всех уровней, по вечерам и выходным.", "Крымский Вал, 9", 2, 19),
    ("avangard@demo.ru", "Роман Т.", "ФК «Авангард»", "Футбол", "Любительский футбол 7×7, набираем составы на каждую неделю.", "Лужнецкая наб., 24", 3, 20),
    ("set@demo.ru", "Ирина М.", "Теннисный клуб «Сет»", "Теннис", "Корты и тренировки для взрослых и детей, парные турниры.", "ул. Остоженка, 7", 4, 18),
    ("sparta@demo.ru", "Игорь Л.", "БК «Спарта»", "Баскетбол", "Баскетбол 3×3 и командные тренировки в зале.", "Ленинградский пр., 33", 5, 19),
]


def seed_communities(db: Session) -> None:
    """Дополнительные сообщества, участники и «мои направления» для демо. Добавляется и в уже заполненную базу."""
    if db.scalar(select(Organization.id).where(Organization.name == CLUBS[0][2])) is not None:
        return
    users = {u.email: u for u in db.scalars(select(User))}
    if "org@demo.ru" not in users:
        return
    sports = {s.name: s for s in db.scalars(select(Sport)) if s.slug}
    clubs = []
    for email, name, title, sport, description, address, days, hour in CLUBS:
        owner = User(
            email=email, name=name, city="Москва", about=f"Руковожу клубом «{title}».", password_hash=hash_password(DEMO_PASSWORD)
        )
        db.add(owner)
        db.flush()
        organization = Organization(
            owner_id=owner.id,
            name=title,
            description=description,
            sports=sport,
            city="Москва",
            contacts="club@example.ru",
            status=OrganizationStatus.approved,
            reviewed_at=now() - timedelta(days=20),
        )
        db.add(organization)
        db.flush()
        starts = _at(days, hour)
        db.add(
            Event(
                title=f"Открытая тренировка: {title}",
                description=description,
                sport_id=sports[sport].id,
                organizer_user_id=owner.id,
                organization_id=organization.id,
                starts_at=starts,
                ends_at=starts + timedelta(hours=2),
                city="Москва",
                address=address,
                latitude=PLACE_COORDINATES[address][0],
                longitude=PLACE_COORDINATES[address][1],
                join_mode=JoinMode.open,
            )
        )
        clubs.append(organization)
    hod = db.scalar(select(Organization).where(Organization.owner_id == users["org@demo.ru"].id))
    members = {
        "user@demo.ru": [clubs[0], clubs[1]] + ([hod] if hod else []),
        "user2@demo.ru": [clubs[0], clubs[2]],
        "ivan@demo.ru": [clubs[0], clubs[3]],
    }
    for email, orgs in members.items():
        if email in users:
            for organization in orgs:
                db.add(OrganizationMember(organization_id=organization.id, user_id=users[email].id))
    if db.scalar(select(UserSport.id).limit(1)) is None:
        levels = {
            "user@demo.ru": [("Бег", SportLevel.amateur), ("Футбол", SportLevel.amateur), ("Шахматы", SportLevel.beginner)],
            "user2@demo.ru": [("Теннис", SportLevel.amateur), ("Бег", SportLevel.beginner)],
            "ivan@demo.ru": [("Баскетбол", SportLevel.pro), ("Бег", SportLevel.amateur)],
        }
        for email, rows in levels.items():
            if email in users:
                for sport, level in rows:
                    db.add(UserSport(user_id=users[email].id, sport_id=sports[sport].id, level=level))
    db.commit()


def seed_if_empty(db: Session) -> bool:
    if db.scalar(select(User.id).limit(1)) is not None:
        # Новые базовые направления появляются и в уже заполненной базе
        ensure_base_sports(db)
        db.commit()
        seed_planning(db)
        seed_communities(db)
        return False
    seed(db)
    seed_planning(db)
    seed_communities(db)
    return True


def main() -> None:
    parser = argparse.ArgumentParser(description="Заполнить базу демо-данными")
    parser.add_argument("--reset", action="store_true", help="удалить все данные и создать заново")
    args = parser.parse_args()
    # Консоль Windows может быть не в UTF-8: сообщение не должно ронять уже выполненный сид
    sys.stdout.reconfigure(errors="replace")

    if args.reset:
        import app.models  # noqa: F401

        Base.metadata.drop_all(engine)
    init_db()
    with SessionLocal() as db:
        created = seed_if_empty(db)
    print("Демо-данные созданы" if created else "База уже заполнена, используйте --reset для пересоздания")


if __name__ == "__main__":
    main()
