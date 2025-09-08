# 🚀 Инструкция по настройке Supabase для Hobbly

## 📋 Содержание
1. [Создание проекта Supabase](#1-создание-проекта-supabase)
2. [Инициализация базы данных](#2-инициализация-базы-данных)
3. [Настройка аутентификации](#3-настройка-аутентификации)
4. [Получение ключей API](#4-получение-ключей-api)
5. [Настройка окружения проекта](#5-настройка-окружения-проекта)
6. [Проверка настройки](#6-проверка-настройки)
7. [Тестовые данные](#7-тестовые-данные)

## 1. Создание проекта Supabase

### Шаг 1.1: Регистрация на Supabase
1. Перейдите на [https://supabase.com](https://supabase.com)
2. Нажмите "Start your project"
3. Войдите через GitHub или создайте аккаунт

### Шаг 1.2: Создание нового проекта
1. Нажмите "New Project"
2. Заполните форму:
   - **Name**: `hobbly` (или любое другое название)
   - **Database Password**: Создайте надежный пароль (сохраните его!)
   - **Region**: Выберите ближайший регион (например, `West EU (Ireland)`)
   - **Pricing Plan**: Free tier подойдет для разработки
3. Нажмите "Create new project"
4. Подождите 1-2 минуты пока проект инициализируется

## 2. Инициализация базы данных

### Шаг 2.1: Открытие SQL редактора
1. В левом меню выберите "SQL Editor"
2. Нажмите "New query"

### Шаг 2.2: Выполнение скрипта инициализации
1. Откройте файл `supabase_init.sql` из корня проекта
2. Скопируйте весь содержимое файла
3. Вставьте в SQL редактор Supabase
4. Нажмите "Run" (или Ctrl+Enter)
5. Дождитесь сообщения об успешном выполнении

### Шаг 2.3: Проверка создания таблиц
1. Перейдите в "Table Editor" в левом меню
2. Убедитесь, что созданы следующие таблицы:
   - `categories` - Категории активностей
   - `tags` - Теги
   - `activities` - Активности/мероприятия
   - `activity_tags` - Связь активностей и тегов
   - `user_profiles` - Профили пользователей

## 3. Настройка аутентификации

### Шаг 3.1: Настройка email аутентификации
1. Перейдите в "Authentication" → "Providers"
2. Убедитесь, что "Email" включен
3. Настройте параметры:
   - **Enable Email Confirmations**: OFF (для тестирования)
   - **Minimum password length**: 8

### Шаг 3.2: Настройка шаблонов писем (опционально)
1. Перейдите в "Authentication" → "Email Templates"
2. Можете настроить шаблоны для:
   - Confirm signup
   - Reset password
   - Magic Link

### Шаг 3.3: Настройка URL перенаправления
1. Перейдите в "Authentication" → "URL Configuration"
2. Добавьте в "Redirect URLs":
   ```
   http://localhost:3000/*
   http://localhost:3000
   ```
3. Для продакшена добавьте ваш домен

## 4. Получение ключей API

### Шаг 4.1: Копирование ключей
1. Перейдите в "Settings" → "API"
2. Скопируйте следующие значения:
   - **Project URL**: `https://your-project.supabase.co`
   - **anon public**: `eyJhbGc...` (длинный ключ)
   - **service_role** (НЕ используйте на клиенте!)

### Шаг 4.2: Сохранение ключей
Сохраните ключи в безопасном месте. Они понадобятся для настройки проекта.

## 5. Настройка окружения проекта

### Шаг 5.1: Создание .env файла
1. В корне проекта создайте файл `.env` (если его нет)
2. Скопируйте содержимое из `.env.example`
3. Заполните значения:

```env
# Supabase Configuration
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGc...ваш_anon_ключ

# Опциональные настройки
PORT=3000
REACT_APP_ENV=development
```

### Шаг 5.2: Проверка .gitignore
Убедитесь, что `.env` добавлен в `.gitignore`:
```gitignore
# env files
.env
.env.local
.env.production
```

## 6. Проверка настройки

### Шаг 6.1: Запуск проекта
```bash
npm start
```

### Шаг 6.2: Проверка консоли
1. Откройте браузер и консоль разработчика (F12)
2. Не должно быть ошибок о отсутствующих переменных окружения
3. Если есть ошибки - проверьте правильность ключей в `.env`

### Шаг 6.3: Тестовая регистрация
1. Попробуйте зарегистрировать нового пользователя
2. Проверьте в Supabase Dashboard → Authentication → Users
3. Новый пользователь должен появиться в списке

## 7. Тестовые данные

### Шаг 7.1: Создание тестового администратора
В SQL редакторе выполните:
```sql
-- Создание тестового администратора
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'admin@hobbly.fi',
    crypt('Admin123!', gen_salt('bf')),
    now(),
    '{"role": "admin", "fullName": "Admin User"}'::jsonb,
    now(),
    now()
);
```

### Шаг 7.2: Создание тестовых активностей
```sql
-- Получаем ID администратора
WITH admin_user AS (
    SELECT id FROM auth.users WHERE email = 'admin@hobbly.fi' LIMIT 1
),
-- Получаем ID категории
sport_category AS (
    SELECT id FROM categories WHERE name = 'Спорт и физическая активность' LIMIT 1
)
-- Создаем тестовую активность
INSERT INTO activities (
    title,
    description,
    type,
    category_id,
    location,
    address,
    price,
    user_id,
    contact_email,
    contact_phone
) 
SELECT 
    'Футбольная секция для детей',
    'Приглашаем детей 7-12 лет в нашу футбольную секцию. Профессиональные тренеры, современное оборудование, дружеская атмосфера.',
    'club',
    sport_category.id,
    'Хельсинки',
    'Спортивный центр, ул. Маннергейма 15',
    25.00,
    admin_user.id,
    'football@hobbly.fi',
    '+358 40 123 4567'
FROM admin_user, sport_category;
```

### Шаг 7.3: Добавление тегов к активности
```sql
-- Связываем активность с тегами
WITH activity AS (
    SELECT id FROM activities WHERE title = 'Футбольная секция для детей' LIMIT 1
),
tags_to_add AS (
    SELECT id FROM tags WHERE name IN ('Подходит для начинающих', 'Подходит для детей', 'Постоянное событие')
)
INSERT INTO activity_tags (activity_id, tag_id)
SELECT activity.id, tags_to_add.id
FROM activity, tags_to_add;
```

## 📝 Важные заметки

### Безопасность
- **НИКОГДА** не используйте `service_role` ключ на клиенте
- `anon` ключ безопасен для использования в браузере
- Всегда используйте Row Level Security (RLS) для защиты данных

### Лимиты бесплатного плана
- 500MB база данных
- 1GB хранилище файлов
- 2GB трансфер
- 50,000 активных пользователей в месяц

### Полезные ссылки
- [Документация Supabase](https://supabase.com/docs)
- [PostgREST операторы](https://postgrest.org/en/stable/api.html#operators)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)

## 🆘 Решение проблем

### Ошибка: "Missing Supabase environment variables"
**Решение**: Проверьте наличие и правильность `.env` файла

### Ошибка: "Invalid API key"
**Решение**: Убедитесь, что скопировали правильный `anon` ключ

### Ошибка: "relation does not exist"
**Решение**: Выполните `supabase_init.sql` скрипт заново

### Ошибка при регистрации пользователя
**Решение**: Проверьте настройки Email провайдера в Authentication

## ✅ Чеклист готовности

- [x] Создан проект в Supabase
- [x] Выполнен SQL скрипт инициализации
- [x] Созданы все необходимые таблицы
- [x] Настроена аутентификация
- [x] Скопированы API ключи
- [x] Создан и настроен `.env` файл
- [x] Проект успешно запускается
- [ ] Работает регистрация пользователей
- [ ] Созданы тестовые данные

---

После выполнения всех шагов ваш Supabase backend готов к работе! 🎉
