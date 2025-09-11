# Supabase Seeder (`seed.mjs`)

## Назначение
Скрипт наполняет проект Supabase тестовыми данными:  
создаёт пользователей через Supabase Auth, заполняет таблицы профилей, категорий, тегов, событий и связывает их между собой.

Используется только в **локальной разработке** или **стейджинге**.  
⚠️ В продакшене применять с осторожностью — сидер использует **Service Role Key**.

---

## Требования
- **Node.js 18+**
- Пакеты:  
  ```bash
  npm i @supabase/supabase-js dotenv uuid
  ```
- Supabase Service Role Key (см. Project Settings → API)

---

## Установка
1. Скопируй `seed.mjs` в корень проекта.
2. Создай файл `.env`:
   ```env
   SUPABASE_URL=https://<your-project>.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
   ```
3. Добавь `.env` в `.gitignore`.

---

## Запуск
```bash
node seed.mjs
```

Пример вывода:
```
== Seeding Supabase (updated spec, phone-safe) ==
User ok: jack.sparrow@gmail.com -> 7f6b...
Rep ok: james.norrington@royalnavy.uk (HMS Interceptor) -> 9c22...
Activity ok: Sea Expedition across the Caribbean -> 8b12...
== Completed ==
┌─────────┬──────────────────────────────────────────────┬──────────────────────┐
│ (index) │ title                                        │ id                   │
├─────────┼──────────────────────────────────────────────┼──────────────────────┤
│    0    │ 'Sea Expedition across the Caribbean'        │ '8b12...'            │
│    1    │ 'Pirate Festival with Music & Dance'         │ '5ac9...'            │
└─────────┴──────────────────────────────────────────────┴──────────────────────┘
```

---

## Какие данные создаются

### 1. Пользователи (Auth + `user_profiles`)
- **Base Users**: Jack Sparrow, Will Turner, Elizabeth Swann, Tia Dalma, Edward Teach, Hector Barbossa, Carina Smyth.
- **Организаторы**: Jack Sparrow, James Norrington, Davy Jones, Captain Salazar.
- Создаются через `auth.admin.createUser`.
- Пароли активны сразу (`email_confirm: true`).
- Телефон в `auth.users` задаётся **только если соответствует формату E.164**, иначе хранится только в `user_profiles`.
- В `user_profiles` поле `isApproved` ставится `true` для админов и организаторов.

### 2. Категории (`categories`)
10 предопределённых категорий:  
Nature & Tourism, Music & Performing Arts, Food & Cooking, Science & Technology, Crafts & Art, Culture & History, Children & Families, Community & Volunteering, Sports & Physical Activity, Games & Esports.

### 3. Теги (`tags`)
12 тегов с фиксированными цветами (например, Free, Beginner-friendly, Registration Required, Adult-friendly и др.).

### 4. События (`activities`)
13 мероприятий: экспедиции, фестивали, мастер-классы, соревнования.  
Каждое событие получает:
- `title`, `description`, `short_description`
- `type`, `category_id`
- `location`, `address`, `coordinates` (JSON)
- `price` и `currency=EUR`
- `image_url` (имя файла/путь)
- `user_id` (организатор)
- `start_date` (ISO)
- `contact_email`, `contact_phone`

Идентификатор события генерируется детерминированно (UUIDv5), поэтому сидер можно запускать повторно без дублей.

### 5. Связи тегов (`activity_tags`)
N:M связи между событиями и тегами.

---

## Идемпотентность
- Повторный запуск не создаст дублей:
  - `users`: ищутся по email
  - `user_profiles`: upsert по `id`
  - `categories`, `tags`: upsert по `name`
  - `activities`: upsert по UUIDv5
  - `activity_tags`: upsert по `(activity_id, tag_id)`

---

## Проверка (SQL в Supabase)
```sql
-- количество профилей
select count(*) from user_profiles;

-- события с организаторами
select up.full_name as organizer, a.title, a.start_date
from activities a
join user_profiles up on up.id = a.user_id;

-- теги по событиям
select a.title, t.name as tag
from activity_tags at
join activities a on a.id = at.activity_id
join tags t on t.id = at.tag_id;
```

---

## Очистка (опционально)
```sql
delete from activity_tags;
delete from activities;
delete from tags;
delete from categories;
delete from user_profiles;
```

Для удаления пользователей из Auth: использовать `supabase.auth.admin.deleteUser(user_id)`.

---

## Важно про безопасность
- `SUPABASE_SERVICE_ROLE_KEY` = полный серверный доступ, обходит RLS.
- Никогда не использовать в клиентских приложениях (React, мобильных).
- Хранить только в `.env` или менеджере секретов.
