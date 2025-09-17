# 📚 API Documentation - Hobbly

## 📋 Содержание

1. [Обзор архитектуры](#обзор-архитектуры)
2. [Конфигурация API](#конфигурация-api)
3. [Аутентификация (Auth API)](#аутентификация-auth-api)
4. [Активности (Activities API)](#активности-activities-api)
5. [Пользователи (Users API)](#пользователи-users-api)
6. [Типы данных](#типы-данных)
7. [Обработка ошибок](#обработка-ошибок)
8. [Примеры использования](#примеры-использования)

---

## 🏗️ Обзор архитектуры

Hobbly использует **Supabase** как Backend-as-a-Service, который предоставляет:

- **PostgreSQL Database** с автоматически генерируемым REST API через PostgREST
- **Supabase Auth** для аутентификации и авторизации
- **Supabase Storage** для файлового хранилища
- **Row Level Security (RLS)** для защиты данных

### Структура API клиентов

```typescript
// REST API для работы с данными
apiClient: AxiosInstance → /rest/v1

// Auth API для аутентификации
authClient: AxiosInstance → /auth/v1

// Storage API для файлов
storageClient: AxiosInstance → /storage/v1
```

---

## ⚙️ Конфигурация API

### Файл: `src/api/config.ts`

#### Переменные окружения

```typescript
// Обязательные переменные
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGc...your_anon_key
```

#### API клиенты

```typescript
// REST API клиент
export const apiClient: AxiosInstance = axios.create({
  baseURL: `${SUPABASE_URL}/rest/v1`,
  headers: {
    'apikey': SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  }
});

// Auth API клиент
export const authClient: AxiosInstance = axios.create({
  baseURL: `${SUPABASE_URL}/auth/v1`,
  headers: {
    'apikey': SUPABASE_ANON_KEY,
    'Content-Type': 'application/json'
  }
});

// Storage API клиент
export const storageClient: AxiosInstance = axios.create({
  baseURL: `${SUPABASE_URL}/storage/v1`,
  headers: {
    'apikey': SUPABASE_ANON_KEY
  }
});
```

#### Управление токенами

```typescript
// Получение токена
const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// Сохранение токена
export const setAuthToken = (token: string): void => {
  localStorage.setItem('auth_token', token);
};

// Удаление токена
export const removeAuthToken = (): void => {
  localStorage.removeItem('auth_token');
};
```

#### Вспомогательные функции

```typescript
// Построение фильтров для PostgREST
export const buildFilterQuery = (filters: Record<string, any>): string

// Построение пагинации
export const buildPaginationConfig = (page: number, limit: number): AxiosRequestConfig

// Построение сортировки
export const buildOrderQuery = (field: string, ascending: boolean): string
```

---

## 🔐 Аутентификация (Auth API)

### Файл: `src/api/auth.api.ts`

#### Класс: `AuthAPI`

### Методы аутентификации

#### 1. Регистрация пользователя

```typescript
async signUp(data: SignUpFormData): Promise<AuthResult>
```

**Параметры:**
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

**Возвращает:**
```typescript
interface AuthResult {
  user: User;
  token: string;
}
```

**Пример использования:**
```typescript
const result = await authAPI.signUp({
  email: 'user@example.com',
  password: 'securePassword123',
  fullName: 'John Doe',
  organizationName: 'Sport Club',
  agreeToTerms: true
});
```

**Особенности:**
- Автоматически определяет роль: если есть `organizationName` → `ORGANIZER`, иначе → `USER`
- Создает профиль в таблице `user_profiles` через триггер `handle_new_user`
- Загружает фото профиля в bucket `avatars` если предоставлено
- Обрабатывает подтверждение email

#### 2. Вход пользователя

```typescript
async signIn(data: SignInFormData): Promise<AuthResult>
```

**Параметры:**
```typescript
interface SignInFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}
```

**Пример использования:**
```typescript
const result = await authAPI.signIn({
  email: 'user@example.com',
  password: 'securePassword123',
  rememberMe: true
});
```

#### 3. Выход пользователя

```typescript
async signOut(): Promise<void>
```

**Пример использования:**
```typescript
await authAPI.signOut();
```

#### 4. Получение текущего пользователя

```typescript
async getCurrentUser(): Promise<User>
```

**Пример использования:**
```typescript
const currentUser = await authAPI.getCurrentUser();
```

**Особенности:**
- Получает данные из таблицы `user_profiles` (основной источник)
- Fallback на данные из `auth.users` если профиль не найден

#### 5. Обновление профиля

```typescript
async updateProfile(data: Partial<User>): Promise<User>
```

**Пример использования:**
```typescript
const updatedUser = await authAPI.updateProfile({
  fullName: 'Jane Doe',
  phone: '+1234567890'
});
```

#### 6. Сброс пароля

```typescript
async resetPassword(newPassword: string): Promise<void>
async requestPasswordReset(email: string): Promise<void>
```

**Пример использования:**
```typescript
// Запрос сброса пароля
await authAPI.requestPasswordReset('user@example.com');

// Установка нового пароля
await authAPI.resetPassword('newSecurePassword123');
```

#### 7. Подтверждение email

```typescript
async verifyEmail(token: string): Promise<User>
```

**Пример использования:**
```typescript
const user = await authAPI.verifyEmail('verification-token');
```

#### 8. Управление токенами

```typescript
async refreshToken(): Promise<string>
async isSessionValid(): Promise<boolean>
async changePassword(oldPassword: string, newPassword: string): Promise<void>
```

### Загрузка фото профиля

#### Приватный метод: `uploadProfilePhoto`

```typescript
private async uploadProfilePhoto(file: File): Promise<string>
```

**Особенности:**
- Валидация файла (размер, тип, расширение)
- Загрузка в bucket `avatars`
- Поддержка альтернативного метода через Supabase JS Client
- Обработка различных типов ошибок

**Валидация:**
- Максимальный размер: 5MB
- Минимальный размер: 1KB
- Разрешенные типы: `image/jpeg`, `image/png`, `image/webp`, `image/gif`
- Разрешенные расширения: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`

---

## 🎯 Активности (Activities API)

### Файл: `src/api/activities.api.ts`

#### Класс: `ActivitiesAPI`

### Основные методы

#### 1. Получение списка активностей

```typescript
async getActivities(
  filters: ActivityFilters = {},
  page: number = 1,
  limit: number = 20,
  orderBy: string = 'created_at',
  ascending: boolean = false
): Promise<ApiListResponse<Activity>>
```

**Параметры фильтрации:**
```typescript
interface ActivityFilters {
  search?: string;           // Поиск по названию, описанию, локации
  categoryId?: string;       // Фильтр по категории
  type?: string;            // Тип активности
  location?: string;        // Локация
  freeOnly?: boolean;       // Только бесплатные
  minPrice?: number;        // Минимальная цена
  maxPrice?: number;        // Максимальная цена
}
```

**Пример использования:**
```typescript
const activities = await activitiesAPI.getActivities(
  { 
    categoryId: '123', 
    freeOnly: true,
    search: 'футбол'
  },
  1,
  20,
  'created_at',
  false
);
```

**Особенности:**
- Использует view `activities_full` для получения полной информации
- Поддерживает сложные фильтры через PostgREST операторы
- Возвращает пагинированные результаты с метаданными

#### 2. Получение активности по ID

```typescript
async getActivityById(id: string): Promise<Activity>
```

**Пример использования:**
```typescript
const activity = await activitiesAPI.getActivityById('123-456-789');
```

#### 3. Создание активности

```typescript
async createActivity(data: ActivityFormData): Promise<Activity>
```

**Параметры:**
```typescript
interface ActivityFormData {
  title: string;
  description: string;
  type: string;
  categoryId: string;
  location: string;
  address?: string;
  price?: number;
  image?: File;
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

**Пример использования:**
```typescript
const newActivity = await activitiesAPI.createActivity({
  title: 'Футбольная секция',
  description: 'Для детей 7-12 лет',
  type: 'club',
  categoryId: '123',
  location: 'Хельсинки',
  price: 30,
  tags: ['tag1', 'tag2']
});
```

#### 4. Обновление активности

```typescript
async updateActivity(id: string, data: Partial<ActivityFormData>): Promise<Activity>
```

**Пример использования:**
```typescript
const updated = await activitiesAPI.updateActivity('123', {
  title: 'Новое название',
  price: 30
});
```

#### 5. Удаление активностей

```typescript
// Мягкое удаление (в корзину)
async softDeleteActivity(id: string): Promise<void>

// Восстановление из корзины
async restoreActivity(id: string): Promise<void>

// Полное удаление
async deleteActivityPermanently(id: string): Promise<void>
```

#### 6. Получение активностей пользователя

```typescript
async getUserActivities(userId: string, includeDeleted: boolean = false): Promise<Activity[]>
```

#### 7. Поиск активностей

```typescript
async searchActivities(
  query: string,
  page: number = 1,
  limit: number = 20
): Promise<ApiListResponse<Activity>>
```

**Особенности:**
- Использует функцию `search_activities` на бэкенде
- Поддерживает полнотекстовый поиск

### Управление категориями и тегами

#### 8. Получение категорий и тегов

```typescript
async getCategories(): Promise<Category[]>
async getTags(): Promise<Tag[]>
```

### Административные функции

#### 9. Модерация активностей

```typescript
// Одобрение/отклонение активности
async approveActivity(id: string, isApproved: boolean): Promise<Activity>

// Получение активностей на модерации
async getPendingActivities(params: {
  page?: number;
  limit?: number;
}): Promise<ApiListResponse<Activity>>

// Статистика активностей
async getActivitiesStats(): Promise<{
  total: number;
  approved: number;
  pending: number;
  deleted: number;
}>
```

### Загрузка изображений

#### Приватный метод: `uploadImage`

```typescript
private async uploadImage(file: File): Promise<string>
```

**Особенности:**
- Загрузка в bucket `activities`
- Автоматическое именование файлов
- Возврат публичного URL

---

## 👥 Пользователи (Users API)

### Файл: `src/api/users.api.ts`

#### Класс: `UsersAPI`

### Основные методы

#### 1. Получение списка пользователей

```typescript
async getUsers(params: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  isApproved?: boolean;
}): Promise<ApiListResponse<User>>
```

**Пример использования:**
```typescript
const users = await usersAPI.getUsers({
  page: 1,
  limit: 20,
  search: 'john',
  role: 'organizer',
  isApproved: true
});
```

#### 2. Получение пользователя по ID

```typescript
async getUser(id: string): Promise<User>
```

#### 3. Обновление пользователя

```typescript
async updateUser(id: string, data: Partial<User>): Promise<User>
```

**Пример использования:**
```typescript
const updatedUser = await usersAPI.updateUser('123', {
  fullName: 'John Doe',
  role: 'organizer',
  isApproved: true
});
```

#### 4. Модерация пользователей

```typescript
// Одобрение/отклонение пользователя
async approveUser(id: string, isApproved: boolean): Promise<User>

// Удаление пользователя (деактивация)
async deleteUser(id: string): Promise<void>
```

#### 5. Статистика пользователей

```typescript
async getUsersStats(): Promise<{
  total: number;
  approved: number;
  pending: number;
  organizers: number;
  admins: number;
}>
```

---

## 📊 Типы данных

### Основные интерфейсы

#### User
```typescript
interface User {
  id: string;
  email: string;
  role: UserRole;
  fullName?: string;
  phone?: string;
  address?: string;
  organizationName?: string;
  organizationAddress?: string;
  organizationNumber?: string;
  photoUrl?: string;
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
  type: string;
  categoryId: string;
  category: Category;
  location: string;
  address?: string;
  coordinates?: any;
  price: number;
  currency: string;
  imageUrl?: string;
  userId: string;
  organizer: User;
  tags: Tag[];
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

#### Category
```typescript
interface Category {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Tag
```typescript
interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: Date;
}
```

#### ApiListResponse
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

### Роли пользователей

```typescript
enum UserRole {
  USER = 'user',           // Обычный пользователь
  ORGANIZER = 'organizer', // Организатор
  ADMIN = 'admin'          // Администратор
}
```

---

## ⚠️ Обработка ошибок

### Стандартизированные ошибки

```typescript
interface ApiError {
  code: string;
  message: string;
  status?: number;
  details?: any;
}
```

### Типы ошибок

| Код | Статус | Описание |
|-----|--------|----------|
| `UNAUTHORIZED` | 401 | Ошибка аутентификации |
| `FORBIDDEN` | 403 | Недостаточно прав |
| `NOT_FOUND` | 404 | Ресурс не найден |
| `CONFLICT` | 409 | Конфликт данных |
| `VALIDATION_ERROR` | 422 | Ошибка валидации |
| `SERVER_ERROR` | 500 | Внутренняя ошибка сервера |
| `NETWORK_ERROR` | - | Ошибка сети |
| `REQUEST_ERROR` | - | Ошибка запроса |

### Обработка в коде

```typescript
try {
  const result = await activitiesAPI.getActivities();
} catch (error: ApiError) {
  switch (error.code) {
    case 'UNAUTHORIZED':
      // Перенаправление на страницу входа
      break;
    case 'FORBIDDEN':
      // Показать сообщение о недостатке прав
      break;
    case 'NOT_FOUND':
      // Показать сообщение "не найдено"
      break;
    default:
      // Общая обработка ошибки
      console.error('API Error:', error.message);
  }
}
```

---

## 💡 Примеры использования

### Полный цикл работы с активностями

```typescript
// 1. Получение списка активностей
const activities = await activitiesAPI.getActivities({
  categoryId: 'sports',
  freeOnly: true
}, 1, 20);

// 2. Получение детальной информации
const activity = await activitiesAPI.getActivityById(activities.data[0].id);

// 3. Создание новой активности
const newActivity = await activitiesAPI.createActivity({
  title: 'Новая активность',
  description: 'Описание активности',
  type: 'event',
  categoryId: 'sports',
  location: 'Хельсинки',
  price: 0
});

// 4. Обновление активности
const updated = await activitiesAPI.updateActivity(newActivity.id, {
  title: 'Обновленное название'
});

// 5. Мягкое удаление
await activitiesAPI.softDeleteActivity(updated.id);
```

### Работа с аутентификацией

```typescript
// 1. Регистрация
const signUpResult = await authAPI.signUp({
  email: 'user@example.com',
  password: 'password123',
  fullName: 'John Doe',
  agreeToTerms: true
});

// 2. Вход
const signInResult = await authAPI.signIn({
  email: 'user@example.com',
  password: 'password123'
});

// 3. Получение текущего пользователя
const currentUser = await authAPI.getCurrentUser();

// 4. Обновление профиля
const updatedUser = await authAPI.updateProfile({
  fullName: 'Jane Doe',
  phone: '+1234567890'
});

// 5. Выход
await authAPI.signOut();
```

### Административные функции

```typescript
// 1. Получение пользователей
const users = await usersAPI.getUsers({
  role: 'organizer',
  isApproved: false
});

// 2. Одобрение пользователя
await usersAPI.approveUser(users.data[0].id, true);

// 3. Получение активностей на модерации
const pendingActivities = await activitiesAPI.getPendingActivities();

// 4. Одобрение активности
await activitiesAPI.approveActivity(pendingActivities.data[0].id, true);

// 5. Статистика
const userStats = await usersAPI.getUsersStats();
const activityStats = await activitiesAPI.getActivitiesStats();
```

---

## 🔧 Дополнительные возможности

### PostgREST операторы

API поддерживает все операторы PostgREST для фильтрации:

- `eq.` - равно
- `neq.` - не равно
- `gt.` - больше
- `gte.` - больше или равно
- `lt.` - меньше
- `lte.` - меньше или равно
- `like.` - LIKE
- `ilike.` - ILIKE (регистронезависимый)
- `is.` - IS NULL/TRUE/FALSE
- `in.` - IN
- `cs.` - содержит
- `cd.` - содержится в

### Пагинация

```typescript
// Использование пагинации
const result = await activitiesAPI.getActivities({}, 2, 10); // страница 2, 10 элементов

console.log(result.pagination); // { page: 2, limit: 10, total: 150 }
console.log(result.total); // 150
```

### Сортировка

```typescript
// Сортировка по дате создания (убывание)
const activities = await activitiesAPI.getActivities({}, 1, 20, 'created_at', false);

// Сортировка по цене (возрастание)
const activities = await activitiesAPI.getActivities({}, 1, 20, 'price', true);
```

---

## 📝 Заключение

API Hobbly предоставляет полный набор функций для:

- ✅ Аутентификации и авторизации пользователей
- ✅ Управления активностями (CRUD операции)
- ✅ Модерации контента
- ✅ Файлового хранилища
- ✅ Поиска и фильтрации
- ✅ Пагинации и сортировки
- ✅ Статистики и аналитики

Все методы имеют подробную документацию, обработку ошибок и примеры использования. API построен на основе Supabase и следует лучшим практикам REST API дизайна.
