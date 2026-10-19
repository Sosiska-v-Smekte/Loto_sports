# План MVP «Спортивный клуб»

Платформа помогает перейти от «хочу заниматься, но не с кем» к конкретной совместной активности. Три роли: пользователь, организация, администратор. Авторизация имитируется демо-аккаунтами.

## Порядок работы
0. Подготовка: план, git, структура.
1. Бэкенд: модели, связи, сид.
2. Бэкенд: сервисы с бизнес-логикой, роутеры, тесты на 6 сценариев и права.
3. Фронтенд: каркас, токены, UI-компоненты, шапка/таб-бар, API-клиент, вход.
4. Главная по макету `docs/design/home.png`.
5. Страница события, создание, «Мои активности», сообщества, профиль, публичный профиль.
6. Админка.
7. Docker: один образ, FastAPI отдаёт API и статику.
8. README и `docs/SCENARIOS.md`.
9. Самопроверка сценариев через запущенное приложение.

## Сущности
| Сущность | Ключевые поля |
|---|---|
| User | name, email, password_hash, avatar_url, city, about, is_admin |
| Session | token, user_id, created_at |
| Organization | owner_id, name, description, sports, city, contacts, status (pending/approved/rejected), rejection_reason, created_at, reviewed_at |
| Sport | name, normalized_name (уникально), slug, color, icon, is_custom, created_by |
| Event | title, description, sport_id, organizer_user_id, organization_id, starts_at, ends_at, city, address, place_details, level (any/beginner/amateur/pro), requirements, join_mode (open/approval), status (published/unpublished/deleted), moderation_reason, created_at |
| Participation | event_id, user_id, status (confirmed/pending/rejected), created_at, decided_at; уникальна пара (event_id, user_id) |
| Comment | event_id, author_id, text, is_hidden, hidden_reason, created_at; `is_organizer_reply` вычисляется |

## Экраны
| Путь | Назначение |
|---|---|
| `/` | Главная: поиск, город, лента дат, чипы направлений, баннер, сетка событий |
| `/login`, `/register` | Вход (email+пароль и демо-доступ), регистрация |
| `/events/:id` | Карточка события, запись, участники, обсуждение, управление, модерация |
| `/events/new` | Создание события |
| `/my` | «Я участвую» / «Я организую» |
| `/communities`, `/communities/:id` | Одобренные организации и страница организации |
| `/profile` | Данные пользователя и блок «Моя организация» |
| `/users/:id` | Публичный профиль организатора |
| `/admin` | Заявки организаций, организации, мероприятия |

## API (`/api`)
- **auth**: `POST /auth/login`, `POST /auth/register`, `POST /auth/logout`, `GET /auth/me`, `GET /auth/demo-accounts`
- **sports**: `GET /sports?q=`
- **events**: `GET /events?q=&city=&date=&sport_id=`, `GET /events/featured?city=`, `GET /events/cities`, `POST /events`, `GET /events/{id}`
- **participations**: `POST /events/{id}/join`, `GET /events/{id}/participants`, `POST /participations/{id}/approve`, `POST /participations/{id}/reject`, `GET /me/participations`, `GET /me/events`
- **comments**: `GET /events/{id}/comments`, `POST /events/{id}/comments`
- **organizations**: `GET /organizations?q=`, `GET /organizations/{id}`, `GET /me/organization`, `POST /me/organization`
- **users**: `GET /users/{id}`
- **admin**: `GET /admin/organizations?status=&q=`, `POST /admin/organizations/{id}/approve`, `POST /admin/organizations/{id}/reject`, `GET /admin/events?status=&q=`, `POST /admin/events/{id}/unpublish`, `POST /admin/events/{id}/delete`, `POST /admin/comments/{id}/hide`

Ошибки: `{ "detail": "понятный русский текст" }` с корректным HTTP-кодом.
