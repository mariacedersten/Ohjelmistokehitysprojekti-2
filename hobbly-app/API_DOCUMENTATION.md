# Документация API слоя приложения Hobbly

## Оглавление
1. [Обзор архитектуры API](#обзор-архитектуры-api)
2. [Конфигурация API (config.ts)](#конфигурация-api-configts)
3. [API аутентификации (auth.api.ts)](#api-аутентификации-authapits)
4. [API активностей (activities.api.ts)](#api-активностей-activitiesapits)
5. [API пользователей (users.api.ts)](#api-пользователей-usersapits)
6. [Типы данных и интерфейсы](#типы-данных-и-интерфейсы)
7. [Обработка ошибок](#обработка-ошибок)
8. [Примеры использования](#примеры-использования)

---

## Обзор архитектуры API

API слой приложения Hobbly построен на базе **Supabase REST API** и обеспечивает универсальный интерфейс для работы с бэкендом. Архитектура включает:

### Основные принципы:
- **API-First подход**: Все взаимодействие с бэкендом происходит через REST API
- **Универсальность**: Возможность смены бэкенда без изменения клиентского кода
- **Типизация**: Полная поддержка TypeScript для безопасности типов
- **Централизованная обработка ошибок**: Единый подход к обработке ошибок API
- **Автоматическое управление токенами**: Автоматическое добавление токенов авторизации

### Структура файлов:
```
src/api/
├── config.ts          # Базовая конфигурация и HTTP клиенты
├── auth.api.ts         # API аутентификации и управления пользователями
├── activities.api.ts   # API управления активностями
└── users.api.ts        # API управления пользователями (админ-панель)
```

---

## Конфигурация API (config.ts)

### Описание
Базовый конфигурационный файл, предоставляющий HTTP клиенты для всех API операций.

### Экспортируемые клиенты

#### `apiClient: AxiosInstance`
**Назначение**: Основной клиент для REST API операций
**Base URL**: `${SUPABASE_URL}/rest/v1`
**Заголовки**:
- `apikey`: Supabase анонимный ключ
- `Content-Type`: `application/json`
- `Prefer`: `return=representation`
- `Authorization`: Bearer токен (автоматически добавляется)

#### `authClient: AxiosInstance`
**Назначение**: Клиент для операций аутентификации
**Base URL**: `${SUPABASE_URL}/auth/v1`
**Заголовки**:
- `apikey`: Supabase анонимный ключ
- `Content-Type`: `application/json`
- `Authorization`: Bearer токен (условно добавляется)

#### `storageClient: AxiosInstance`
**Назначение**: Клиент для работы с файловым хранилищем
**Base URL**: `${SUPABASE_URL}/storage/v1`
**Заголовки**:
- `apikey`: Supabase анонимный ключ
- `Authorization`: Bearer токен (автоматически добавляется)

### Управление токенами

```typescript
// Получение токена из localStorage
const getAuthToken = (): string | null

// Сохранение токена в localStorage
export const setAuthToken = (token: string): void

// Удаление токена из localStorage
export const removeAuthToken = (): void
```

### Вспомогательные функции

#### `buildFilterQuery(filters: Record<string, any>): string`
**Назначение**: Построение строки фильтров для Supabase PostgREST
**Поддерживаемые операторы**:
- `eq.` - равенство
- `ilike.` - поиск с учетом регистра
- `is.` - булевые значения
- `cs.` - содержит (для массивов)
- `gte.`/`lte.` - больше/меньше равно
- `or` - OR условия

**Пример**:
```typescript
const filters = {
  title: 'ilike.*футбол*',
  isDeleted: 'is.false',
  price: 'gte.0'
};
const query = buildFilterQuery(filters);
// Результат: "title=ilike.*футбол*&isDeleted=is.false&price=gte.0"
```

#### `buildPaginationConfig(page: number, limit: number): AxiosRequestConfig`
**Назначение**: Построение конфигурации пагинации для PostgREST
**Заголовки**:
- `Range`: `${offset}-${offset + limit - 1}`
- `Range-Unit`: `items`
- `Prefer`: `count=exact`

#### `buildOrderQuery(field: string, ascending: boolean): string`
**Назначение**: Построение параметра сортировки
**Пример**: `buildOrderQuery('created_at', false)` → `created_at.desc`

### Перехватчики (Interceptors)

#### Request Interceptor
Автоматически добавляет токен авторизации ко всем запросам:
```typescript
config.headers['Authorization'] = `Bearer ${token}`;
```

#### Response Interceptor
Централизованная обработка ошибок с преобразованием в формат `ApiError`:
- Автоматическое удаление токена при 401 ошибке
- Локализованные сообщения об ошибках
- Детальная информация об ошибках для отладки

### Константы

```typescript
export const API_URLS = {
  BASE: SUPABASE_URL,
  REST: `${SUPABASE_URL}/rest/v1`,
  AUTH: `${SUPABASE_URL}/auth/v1`,
  STORAGE: `${SUPABASE_URL}/storage/v1`,
  REALTIME: `${SUPABASE_URL}/realtime/v1`
};

export const API_CONSTANTS = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_TIMEOUT: 30000,
  STORAGE_BUCKET: 'activities'
};
```

---

## API аутентификации (auth.api.ts)

### Класс AuthAPI

Обеспечивает все функции аутентификации и управления профилем пользователей.

### Методы класса

#### `signUp(data: SignUpFormData): Promise<AuthResult>`
**Назначение**: Регистрация нового пользователя
**Алгоритм**:
1. Определение роли пользователя (ORGANIZER при наличии организации, иначе USER)
2. Создание пользователя в Supabase Auth с метаданными
3. Автоматическое создание профиля в `user_profiles` (триггер `handle_new_user`)
4. Обновление профиля дополнительными данными
5. Загрузка фото профиля (опционально)

**Входные данные**:
```typescript
interface SignUpFormData {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  address?: string;
  organizationName?: string;
  organizationAddress?: string;
  organizationNumber?: string;
  photo?: File;
  agreeToTerms: boolean;
}
```

**Возвращаемые данные**:
```typescript
interface AuthResult {
  user: User;
  token: string;
}
```

#### `signIn(data: SignInFormData): Promise<AuthResult>`
**Назначение**: Аутентификация пользователя
**Алгоритм**:
1. Отправка запроса аутентификации в Supabase Auth
2. Сохранение access и refresh токенов
3. Получение полного профиля из `user_profiles`
4. Возврат объединенных данных

**Входные данные**:
```typescript
interface SignInFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}
```

#### `signOut(): Promise<void>`
**Назначение**: Выход пользователя из системы
**Действия**:
- Отправка запроса logout в Supabase Auth
- Очистка всех токенов из localStorage

#### `getCurrentUser(): Promise<User>`
**Назначение**: Получение текущего аутентифицированного пользователя
**Источники данных**:
1. **Основной**: таблица `user_profiles` (полная информация)
2. **Fallback**: Supabase Auth (базовая информация)

#### `updateProfile(data: Partial<User> & { photo?: File }): Promise<User>`
**Назначение**: Обновление профиля пользователя
**Поддерживаемые поля**:
- `fullName` → `full_name`
- `phone` → `phone`
- `address` → `address`
- `organizationName` → `organization_name`
- `organizationAddress` → `organization_address`
- `organizationNumber` → `organization_number`
- `role` → `role`
- `photo` → загрузка и обновление `avatar_url`

#### `uploadProfilePhoto(file: File): Promise<string>`
**Назначение**: Загрузка фото профиля в Supabase Storage
**Валидация файла**:
- Максимальный размер: 5MB
- Минимальный размер: 1KB
- Поддерживаемые форматы: JPEG, PNG, WebP, GIF
- Проверка расширения файла

**Методы загрузки**:
1. **Альтернативный**: Supabase JS Client (приоритет)
2. **Основной**: REST API через axios

**Возвращаемый URL**: `${SUPABASE_URL}/storage/v1/object/public/avatars/${fileName}`

#### Дополнительные методы
- `resetPassword(newPassword: string): Promise<void>` - Сброс пароля
- `requestPasswordReset(email: string): Promise<void>` - Запрос сброса пароля
- `verifyEmail(token: string): Promise<User>` - Подтверждение email
- `refreshToken(): Promise<string>` - Обновление токена
- `isSessionValid(): Promise<boolean>` - Проверка валидности сессии
- `changePassword(oldPassword: string, newPassword: string): Promise<void>` - Смена пароля

### Обработка данных

#### `transformSupabaseUser(supabaseUser: SupabaseUser): User`
Преобразует данные пользователя из Supabase Auth в локальный формат User.

#### `transformUserProfile(profile: any): User`
Преобразует данные профиля из таблицы `user_profiles` в локальный формат User.

---

## API активностей (activities.api.ts)

### Класс ActivitiesAPI

Обеспечивает полный CRUD для активностей с поддержкой фильтрации, пагинации и управления правами доступа.

### Ключевые эндпоинты
- **Основная таблица**: `/activities`
- **Представление**: `/activities_full` (объединенные данные с категориями и организаторами)

### Методы класса

#### `getActivities(filters, page, limit, orderBy, ascending, currentUserId, currentUserRole): Promise<ApiListResponse<Activity>>`
**Назначение**: Получение списка подтвержденных активностей

**Особенности**:
- Возвращает только `isApproved=true` активности
- Для ORGANIZER - только собственные активности
- Исключает удаленные (`is_deleted=false`)

**Фильтрация**:
```typescript
interface ActivityFilters {
  search?: string;        // Поиск по title, description, location, organizer_name
  categoryId?: string;    // Фильтр по категории
  type?: ActivityType;    // Фильтр по типу активности
  location?: string;      // Поиск по местоположению
  freeOnly?: boolean;     // Только бесплатные активности
  minPrice?: number;      // Минимальная цена
  maxPrice?: number;      // Максимальная цена
}
```

#### `getActivityById(id: string): Promise<Activity>`
**Назначение**: Получение детальной информации об активности
**Дополнительные данные**:
- Информация об организаторе из `user_profiles`
- Фото организатора (`avatar_url`)
- Полная информация о категории

#### `createActivity(data: ActivityFormData, currentUserId: string): Promise<Activity>`
**Назначение**: Создание новой активности

**Алгоритм**:
1. Валидация обязательных полей
2. Загрузка изображения (опционально)
3. Подготовка данных для БД
4. Создание записи в таблице `activities`
5. Добавление тегов через таблицу `activity_tags`
6. Возврат полной информации об активности

**Входные данные**:
```typescript
interface ActivityFormData {
  title: string;
  description: string;
  shortDescription?: string;
  type: ActivityType;
  categoryId: string;
  location: string;
  address?: string;
  price?: number;
  currency?: string;
  image?: File;
  imageUrl?: string;
  startDate?: Date;
  endDate?: Date;
  maxParticipants?: number;
  minAge?: number;
  maxAge?: number;
  contactEmail?: string;
  contactPhone?: string;
  externalLink?: string;
  tags?: string[];
}
```

#### `updateActivity(id, data, currentUserId, currentUserRole): Promise<Activity>`
**Назначение**: Обновление существующей активности
**Контроль доступа**: ORGANIZER может редактировать только свои активности

#### `softDeleteActivity(id, currentUserId, currentUserRole): Promise<void>`
**Назначение**: Мягкое удаление (перемещение в корзину)
**Действие**: Устанавливает `is_deleted=true`

#### `restoreActivity(id, currentUserId, currentUserRole): Promise<void>`
**Назначение**: Восстановление из корзины
**Действие**: Устанавливает `is_deleted=false`

#### `permanentDeleteActivity(id, currentUserId, currentUserRole): Promise<void>`
**Назначение**: Полное удаление активности
**Действия**:
1. Удаление изображения из Storage
2. Удаление записи из БД

#### `getDeletedActivities(page, limit, currentUserId, currentUserRole, search): Promise<ApiListResponse<Activity>>`
**Назначение**: Получение удаленных активностей для корзины
**Условие**: Возвращает только `is_deleted=true`

#### `getAllActivitiesForAdmin(filters, page, limit, orderBy, ascending, currentUserId, currentUserRole): Promise<ApiListResponse<Activity>>`
**Назначение**: Получение всех активностей для админ-панели
**Особенность**: Включает неподтвержденные активности (без фильтра `isApproved`)

#### `getUserActivities(userId, includeDeleted, currentUserId, currentUserRole): Promise<Activity[]>`
**Назначение**: Получение активностей конкретного пользователя
**Контроль доступа**: ORGANIZER видит только свои активности

#### Методы для работы с категориями и тегами

- `getCategories(): Promise<Category[]>` - Получение всех категорий
- `getTags(): Promise<Tag[]>` - Получение всех тегов
- `getActivityTypes(): Promise<{id: string, name: string, value: string}[]>` - Получение типов активностей

#### `searchActivities(query, page, limit): Promise<ApiListResponse<Activity>>`
**Назначение**: Полнотекстовый поиск активностей
**Метод**: Использует функцию `search_activities` на бэкенде

#### Методы одобрения (модерация)

- `approveActivity(id: string, isApproved: boolean): Promise<Activity>` - Одобрение/отклонение активности
- `getPendingActivities(params): Promise<ApiListResponse<Activity>>` - Получение активностей на модерации
- `getActivitiesStats(): Promise<{total, approved, pending, deleted}>` - Статистика активностей

### Управление файлами

#### `uploadImage(file: File): Promise<string>`
**Назначение**: Загрузка изображений активностей
**Bucket**: `activities`
**Путь**: `activities/${timestamp}-${filename}`

#### `deleteImage(imageUrl: string): Promise<void>`
**Назначение**: Удаление изображений из Storage

### Управление тегами

#### `addTagsToActivity(activityId: string, tagIds: string[]): Promise<void>`
**Назначение**: Привязка тегов к активности через таблицу `activity_tags`

#### `updateActivityTags(activityId: string, tagIds: string[]): Promise<void>`
**Назначение**: Обновление тегов активности
**Алгоритм**:
1. Удаление старых связей
2. Добавление новых связей

### Преобразование данных

#### `transformActivity(activity: any): Activity`
**Назначение**: Преобразование данных из API в локальный формат
**Источник**: Представление `activities_full`
**Включает**:
- Информацию о категории
- Данные организатора
- Обработку дат и координат
- Преобразование названий полей БД в клиентские имена

---

## API пользователей (users.api.ts)

### Класс UsersAPI

Обеспечивает управление пользователями для админ-панели.

### Методы класса

#### `getUsers(params): Promise<ApiListResponse<User>>`
**Назначение**: Получение списка пользователей с фильтрацией

**Параметры фильтрации**:
```typescript
{
  page?: number;
  limit?: number;
  search?: string;        // Поиск по full_name, email, organization_name
  role?: string;          // Фильтр по роли
  isApproved?: boolean;   // Фильтр по статусу подтверждения
}
```

#### `getUser(id: string): Promise<User>`
**Назначение**: Получение пользователя по ID

#### `approveUser(id: string, isApproved: boolean): Promise<User>`
**Назначение**: Одобрение/отклонение пользователя
**Действие**: Обновляет поле `isApproved`

#### `updateUser(id: string, data: Partial<User>): Promise<User>`
**Назначение**: Обновление данных пользователя
**Поддерживаемые поля**:
- `fullName` → `full_name`
- `organizationName` → `organization_name`
- `phone` → `phone`
- `role` → `role`
- `isApproved` → `isApproved`

#### `deleteUser(id: string): Promise<void>`
**Назначение**: "Удаление" пользователя
**Действие**: Устанавливает `isApproved=false` (деактивация)

#### `getUsersStats(): Promise<{total, approved, pending, organizers, admins}>`
**Назначение**: Получение статистики пользователей

### Преобразование данных

#### `transformUser(user: any): User`
**Назначение**: Преобразование данных пользователя из БД в клиентский формат
**Поля**:
- `full_name` → `fullName`
- `organization_name` → `organizationName`
- `created_at` → `createdAt` (Date)
- `updated_at` → `updatedAt` (Date)

---

## Типы данных и интерфейсы

### Основные интерфейсы

#### User
```typescript
interface User {
  id: string;
  email: string;
  role: UserRole;
  organizationName?: string;
  fullName?: string;
  phone?: string;
  address?: string;
  organizationAddress?: string;
  organizationNumber?: string;
  photoUrl?: string;
  profilePhotoUrl?: string;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Activity
```typescript
interface Activity {
  id: string;
  title: string;
  description: string;
  shortDescription?: string;
  type: ActivityType;
  categoryId: string;
  category?: Category;
  location: string;
  address?: string;
  coordinates?: { lat: number; lng: number };
  price?: number;
  currency?: string;
  imageUrl?: string;
  userId: string;
  organizer?: User;
  tags?: Tag[];
  startDate?: Date;
  endDate?: Date;
  maxParticipants?: number;
  minAge?: number;
  maxAge?: number;
  contactEmail?: string;
  contactPhone?: string;
  externalLink?: string;
  isDeleted: boolean;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### ApiListResponse<T>
```typescript
interface ApiListResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
  total: number;
}
```

#### ApiError
```typescript
interface ApiError {
  code: string;
  message: string;
  status?: number;
  details?: any;
}
```

### Енумы

#### UserRole
```typescript
enum UserRole {
  USER = 'user',
  ORGANIZER = 'organizer',
  ADMIN = 'admin'
}
```

#### ActivityType
```typescript
enum ActivityType {
  ACTIVITY = 'activity',
  EVENT = 'event',
  HOBBY_OPPORTUNITY = 'hobby_opportunity',
  CLUB = 'club',
  COMPETITION = 'competition'
}
```

---

## Обработка ошибок

### Централизованная обработка

Все HTTP клиенты используют единый interceptor для обработки ошибок:

```typescript
const errorInterceptor = (error: AxiosError): Promise<ApiError>
```

### Типы ошибок

#### HTTP статусы
- **400 Bad Request**: Неверный синтаксис запроса
- **401 Unauthorized**: Требуется аутентификация (автоматическая очистка токена)
- **403 Forbidden**: Доступ запрещен
- **404 Not Found**: Ресурс не найден
- **409 Conflict**: Конфликт данных (дублирование)
- **422 Validation Error**: Ошибка валидации
- **500 Server Error**: Внутренняя ошибка сервера

#### Сетевые ошибки
- **NETWORK_ERROR**: Нет ответа от сервера
- **REQUEST_ERROR**: Ошибка настройки запроса
- **TIMEOUT**: Превышение времени ожидания

### Локализация ошибок

Все ошибки переводятся на английский язык для финской аудитории:
- Автоматическое извлечение сообщений сервера
- Пользовательские дружественные сообщения
- Детальная информация для разработчиков

---

## Примеры использования

### Аутентификация

```typescript
import authAPI from '../api/auth.api';

// Регистрация
const registerUser = async () => {
  try {
    const result = await authAPI.signUp({
      email: 'user@example.com',
      password: 'securePassword123',
      fullName: 'John Doe',
      organizationName: 'Sport Club',
      agreeToTerms: true
    });
    console.log('User registered:', result.user);
    console.log('Token:', result.token);
  } catch (error) {
    console.error('Registration failed:', error.message);
  }
};

// Вход
const loginUser = async () => {
  try {
    const result = await authAPI.signIn({
      email: 'user@example.com',
      password: 'securePassword123',
      rememberMe: true
    });
    console.log('User logged in:', result.user);
  } catch (error) {
    console.error('Login failed:', error.message);
  }
};

// Получение текущего пользователя
const getCurrentUser = async () => {
  try {
    const user = await authAPI.getCurrentUser();
    console.log('Current user:', user);
  } catch (error) {
    console.error('Failed to get user:', error.message);
  }
};
```

### Работа с активностями

```typescript
import activitiesAPI from '../api/activities.api';
import { ActivityType, UserRole } from '../types';

// Получение списка активностей
const getActivities = async () => {
  try {
    const response = await activitiesAPI.getActivities(
      {
        search: 'футбол',
        categoryId: '123',
        freeOnly: true
      },
      1, // page
      20, // limit
      'created_at',
      false, // ascending
      'user-123',
      UserRole.ORGANIZER
    );
    console.log('Activities:', response.data);
    console.log('Total:', response.total);
  } catch (error) {
    console.error('Failed to fetch activities:', error.message);
  }
};

// Создание активности
const createActivity = async () => {
  try {
    const activity = await activitiesAPI.createActivity({
      title: 'Футбольная секция',
      description: 'Для детей 7-12 лет',
      type: ActivityType.CLUB,
      categoryId: '123',
      location: 'Хельсинки',
      price: 50,
      tags: ['tag1', 'tag2']
    }, 'user-123');
    console.log('Activity created:', activity);
  } catch (error) {
    console.error('Failed to create activity:', error.message);
  }
};

// Поиск активностей
const searchActivities = async () => {
  try {
    const response = await activitiesAPI.searchActivities('футбол', 1, 10);
    console.log('Search results:', response.data);
  } catch (error) {
    console.error('Search failed:', error.message);
  }
};
```

### Управление пользователями

```typescript
import usersAPI from '../api/users.api';

// Получение списка пользователей
const getUsers = async () => {
  try {
    const response = await usersAPI.getUsers({
      page: 1,
      limit: 20,
      search: 'john',
      role: 'organizer',
      isApproved: true
    });
    console.log('Users:', response.data);
  } catch (error) {
    console.error('Failed to fetch users:', error.message);
  }
};

// Одобрение пользователя
const approveUser = async (userId: string) => {
  try {
    const user = await usersAPI.approveUser(userId, true);
    console.log('User approved:', user);
  } catch (error) {
    console.error('Failed to approve user:', error.message);
  }
};

// Статистика пользователей
const getUserStats = async () => {
  try {
    const stats = await usersAPI.getUsersStats();
    console.log('User statistics:', stats);
  } catch (error) {
    console.error('Failed to fetch stats:', error.message);
  }
};
```

### Работа с конфигурацией

```typescript
import { buildFilterQuery, buildPaginationConfig, buildOrderQuery } from '../api/config';

// Построение фильтров
const filters = {
  title: 'ilike.*sport*',
  isDeleted: 'is.false',
  price: 'gte.0'
};
const queryString = buildFilterQuery(filters);
console.log('Filter query:', queryString);

// Построение пагинации
const paginationConfig = buildPaginationConfig(2, 10);
console.log('Pagination config:', paginationConfig);

// Построение сортировки
const orderQuery = buildOrderQuery('created_at', false);
console.log('Order query:', orderQuery);
```

---

## Заключение

API слой приложения Hobbly обеспечивает:

✅ **Полную типизацию** всех операций
✅ **Централизованную обработку ошибок**
✅ **Автоматическое управление токенами**
✅ **Универсальный интерфейс** для всех операций
✅ **Поддержку пагинации и фильтрации**
✅ **Контроль доступа на уровне API**
✅ **Работу с файловым хранилищем**
✅ **Полную совместимость с Supabase**

Архитектура позволяет легко расширять функциональность и при необходимости мигрировать на другой бэкенд без изменения клиентского кода.