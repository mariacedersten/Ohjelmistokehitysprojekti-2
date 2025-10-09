# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hobbly Technologies Oy is a modern technology company whose mission is to make people's daily lives easier by providing easy access to hobbies and leisure opportunities. The company strives to enhance well-being and social interaction by offering digital solutions that connect users with service providers and recreational activities.

## Project RULES

- **Maximal Documentation**: Every function, file, step, and architecture must be documented
- **API Universality**: Backend accessed via Supabase REST API for universality and backend flexibility
- **Clear Separation**: Mobile and admin components must not cross-reference each other
- **Shared Library Pattern**: Common functionality (API, auth, types) should be easily extractable
- Приложение на английском языке, для финляндии. Только документация и коментарии должны быть на русском.
- Не меняй код который не просят!

### Project Goal

Develop a mobile application and admin panel that unite a wide range of leisure and activity opportunities. The application should allow users to easily find suitable options and obtain reliable information about service providers.

The application targets different user groups: children, teenagers, adults, families, and elderly people. The solution must be convenient, attractive, and work on various devices.

### Development Approach

- **Mobile First**: User interface primarily optimized for mobile browsers (375px). But it should also be adapted to other mobile formats.
- **Desktop First**: Admin panel primarily designed for large screens (1440px). But it should also be adapted to other formats.

## Project Requirements

### Core Application Features

1. **Activity Information Collection**
   - Service providers can add their events to the application
   - Users can filter activities by multiple parameters

2. **Filtering and Search**
   - Users can search hobbies by location, activity type, price, time, or target group
   - Ability to use multiple filters simultaneously

3. **Service Provider Information**
   - Clear information for each activity: description, location, contacts, schedule, and prices
   - Links to provider website or registration forms

4. **Usability and Accessibility**
   - Simple to use for all ages
   - Clear interface following accessibility principles

5. **Admin Panel for Service Providers**
   - Sports clubs, municipalities, associations, and companies can add, edit, and delete events
   - Administrators can approve and control content

6. **Future Scalability**
   - Application can be extended (user ratings, reviews)
   - Payment service integration possibilities

### Technical Specifications

### Admin Panel Implementation

**Core Functions:**
- User registration and email/password login
- Password change in user settings
- Add, edit, delete activities (only own listings)
- Administrator rights for managing all listings and users
- Two-step deletion (trash and permanent deletion)

**User Registration:**
- Multi-step form (contact data, basic data, organization info)
- Email used as login
- Secure passwords (minimum 8 characters and one digit)
- Secure password storage (bcrypt or Argon2)

**User Roles:**
- **Organizers** (sports clubs, associations, companies) → see and manage only their listings
- **Administrators** (Hobbly staff) → can manage all accounts and listings

### Mobile Interface Implementation

**Bottom Navigation Bar** for easy page transitions

**Main Pages:**
- **Listings** (home): list of all hobby and activity listings
- **Search**: search functionality for hobbies and events
- **Map**: display listing locations on map

**Data Loading:**
- All information loaded via REST API
- Infinite scroll pagination for activity lists
- OpenAPI documentation interpretation required

**Listing Display:**
Each listing shows:
- Title
- Image
- Short description (up to 100 characters)
- Organization name

**Detailed View:**
- Full activity information
- Contact details
- Search by title, description, organization name, and tags

### Content Categories

**Event Types (5):**
- Activity
- Event
- Hobby Opportunity
- Club
- Competition

**Categories (10):**
- Sports and Physical Activity
- Music and Performing Arts
- Crafts and Art
- Science and Technology
- Games and Esports
- Food and Cooking
- Nature and Tourism
- Culture and History
- Community and Volunteering
- Children and Families

**Tags (10 examples):**
- Free
- Open to All
- Suitable for Beginners
- Ongoing Event
- Online
- Family-Friendly
- Suitable for Seniors
- Suitable for Special Groups
- Equipment Provided
- Registration Required

## Quality Requirements

- **Semantic HTML/CSS**: Code must be semantically correct considering accessibility
- **Testing**: Use Chrome Lighthouse and axe DevTools for accessibility and quality assurance
- **Mobile-First Approach**: Primary focus on 375px width
- **Brand Compliance**: Follow established brand guidelines
- **Security and Usability**: Must be considered in all features
- **Performance**: Comfortable user experience even with large data volumes

## Architectural Separation Strategy

**CRITICAL REQUIREMENT**: The admin panel and mobile application must be maximally separated to enable future migration to separate projects. This architectural approach provides:

### Separation Benefits
- **Independent Development**: Different teams can work on mobile vs admin without conflicts
- **Optimized Deployments**: Mobile app and admin panel can be deployed independently
- **Performance Optimization**: Each application loads only necessary code
- **Technology Flexibility**: Future ability to use different frameworks/technologies
- **Scalability**: Independent scaling based on usage patterns

### Current Monorepo Structure
While currently in a single React project, code should be organized with clear boundaries:
```
src/
├── mobile/          # Mobile-first components and pages (375px)
│   ├── components/  # Bottom navigation, mobile cards, etc.
│   └── pages/       # Cover, Home, Search, Map, Activity Details
├── admin/           # Desktop-first components and pages (1440px)
│   ├── components/  # Sidebar, tables, desktop forms, etc.
│   └── pages/       # Dashboard, Activities Management, Users
├── shared/          # Common code for both applications
│   ├── api/         # Supabase REST API clients
│   ├── contexts/    # Authentication context
│   ├── types/       # TypeScript interfaces
│   └── utils/       # Utility functions
```

## Development Commands

### Core Commands
```bash
# Development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Eject from Create React App (use with caution)
npm run eject
```

## Tech Stack & Architecture

### Frontend
- **React 18.x** with **TypeScript 4.9.5** for type safety
- **React Router v6** for client-side routing
- **Axios 1.11.0** for HTTP requests to REST API
- **CSS Modules** for component styling

### Backend
- **Supabase** as Backend-as-a-Service
  - PostgreSQL - База данных
  - Auth - Аутентификация
  - Storage - Хранение файлов
  - REST API - Автоматически генерируемый API

### Application Structure
This is a **mobile-first React application** for Hobbly - a platform connecting hobby/activity providers with users. The app has two main interfaces:
1. **Mobile Web App** (mobile-first) - User interface for finding activities
2. **Admin Panel** (desktop-first) - Provider interface for managing activities

### Key Architecture Patterns
- **API-First**: All backend interaction through REST API (`src/api/`)
- **Component Architecture**: Reusable components with CSS Modules
- **Type Safety**: Comprehensive TypeScript interfaces (`src/types/index.ts`)
- **Barrel Exports**: Clean imports using index.ts files

## API Configuration

### Environment Variables
Required environment variables (create `.env` file):
```bash
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### API Clients (src/api/config.ts)
- `apiClient` - REST API for data operations (`/rest/v1`)
- `authClient` - Authentication API (`/auth/v1`)
- `storageClient` - File storage API (`/storage/v1`)

All clients include:
- Automatic token management with localStorage
- Comprehensive error handling and localization (Finland - English)
- Request/Response interceptors for authentication
- Automatic token removal on 401 errors

## Routing Architecture

### Dual Client Routing Strategy

The application uses **separate URL prefixes** for mobile and admin interfaces to ensure complete separation:

### Mobile Application Routes (Mobile-First - 375px)
**Base URL: `/mobile/`** - User interface for finding activities
```
/mobile/                    # 🏠 Home - Activity listings with infinite scroll
/mobile/search              # 🔍 Search with filters and categories
/mobile/map                 # 🗺️ Map view with activity locations
/mobile/activity/:id        # 📋 Activity detail page with contact info
/mobile/login               # 🔐 User authentication (required)
/mobile/signup              # 📝 User registration (required)
```

**Navigation:** Bottom Navigation Bar for easy touch-based navigation between main sections.
**Authentication:** Required for all mobile users to access the application.

### Admin Panel Routes (Desktop-First - 1440px)
**Base URL: `/admin/`** - Management interface for service providers
```
/admin/                     # 🏠 Welcome/landing page for providers
/admin/login               # 🔐 Email/password authentication
/admin/signup              # 📝 Multi-step organization registration
/admin/dashboard           # 📊 Analytics dashboard with statistics
/admin/activities          # 📋 Activities management table (CRUD)
/admin/activities/new      # ➕ Create new activity form
/admin/activities/:id      # ✏️ Edit existing activity
/admin/activities/trash    # 🗑️ Soft-deleted activities (trash bin)
/admin/users               # 👥 User management (Admin role only)
/admin/personal-info       # ⚙️ Profile settings and password change
```

**Navigation:** Sidebar navigation with role-based menu items and breadcrumbs.

### Root Route Behavior
```
/                          # Redirects to /mobile/ by default
/*                         # Unknown routes redirect appropriately
```

### Route Protection & Access Control

#### Public Routes (No Authentication Required)
- **Mobile:** `/mobile/login`, `/mobile/signup`
- **Admin:** `/admin/`, `/admin/login`, `/admin/signup`

#### Protected Routes (Authentication Required)
- **Mobile Routes:** `/mobile/`, `/mobile/search`, `/mobile/map`, `/mobile/activity/:id` (requires authenticated user)
- **Admin Routes:** `/admin/dashboard`, `/admin/activities/*`, `/admin/personal-info` (requires ORGANIZER or ADMIN role)

#### Role-Based Access Control
- **Admin Only:** `/admin/users` (requires UserRole.ADMIN)
- **Organizer Access:** Can only manage their own activities in `/admin/activities/*`
- **Mobile Users:** Must authenticate to view activities

## Styling System

### CSS Architecture
- **CSS Modules** for component isolation
- **Global variables** in `src/styles/variables.css`
- **Mobile-first** responsive design approach
- **Montserrat** font family from Google Fonts

### Color Palette (Hobbly Brand Guidelines)
- Primary Dark: `#073B3A`
- Accent Yellow: `#F5FF65`
- Accent Green: `#65FF81`
- Dark: `#021919`
- Gray: `#8F8F8F`
- White: `#FFFFFF`

## Component Isolation Strategy

**Mobile Components** (should never import admin components):
- Bottom navigation patterns
- Mobile-optimized cards and lists
- Touch-friendly interfaces
- Infinite scroll implementations

**Admin Components** (should never import mobile components):
- Desktop sidebar navigation
- Data tables and forms
- Multi-column layouts
- Desktop-optimized modals and dropdowns

**Shared UI Components** (can be used by both):
- Basic Button, Input, Icon components
- Loading states and error messages
- Modal/dialog base components

## Supabase Backend Integration

### Core Services
- **PostgreSQL Database** with Row Level Security (RLS)
- **Authentication (GoTrue)** with JWT tokens and role-based access
- **Storage** for file uploads (avatars, activity images)
- **REST API (PostgREST)** automatically generated from database schema

### Key Tables
- `user_profiles` - Extended user profiles with roles (USER, ORGANIZER, ADMIN)
- `activities` - Activities and events with full metadata
- `categories` - Activity categories with icons
- `tags` - Tags for activity classification
- `activity_tags` - Many-to-many relationship between activities and tags

### Security Implementation
- Row Level Security (RLS) enabled for all tables
- JWT tokens with automatic expiration
- Role-based access control through database policies
- File upload security with type and size validation

## Important Notes

- Project uses **Russian language** in documentation and comments, **English** for the application UI
- **TypeScript strict mode** enabled with comprehensive type definitions
- **Barrel exports** pattern used throughout for clean imports
- **JSDoc documentation** extensively used in components and API layer
- All components use **CSS Modules** for style isolation
- **AuthContext** provides authentication state management throughout the app
- **Separation Strategy**: Admin panel and mobile app must remain maximally decoupled for future extraction

---

## 🎯 ТЕКУЩИЙ СТАТУС ПРОЕКТА (17 сентября 2025)

### ✅ **Что работает:**

#### **Базовая инфраструктура:**
- ✅ **Архитектура разделения** mobile/admin полностью реализована
- ✅ **Маршрутизация** между `/mobile/*` и `/admin/*` работает
- ✅ **API слой** полностью готов и протестирован
- ✅ **Система типов** TypeScript полностью настроена
- ✅ **Shared библиотека** компонентов готова к использованию

#### **Supabase Backend Integration:**
- ✅ **PostgreSQL Database** - полная схема с RLS политиками
- ✅ **Authentication (GoTrue)** - JWT токены, роли, сессии
- ✅ **Storage** - файловое хранилище для изображений
- ✅ **REST API (PostgREST)** - автоматически генерируемый API

#### **Админ-панель (Desktop-first):**
- ✅ **Login страница** - полностью готова с дизайном
- ✅ **SignUp страница** - многошаговая регистрация с загрузкой фото
- ✅ **Dashboard** - аналитика, статистика, быстрые действия
- ✅ **Users управление** - поиск, редактирование, управление ролями
- ✅ **Activities управление** - полная CRUD функциональность
- ✅ **Activity Form** - создание/редактирование активностей
- ✅ **Trash система** - двухэтапное удаление
- ✅ **Personal Info** - профиль и смена пароля
- ✅ **Sidebar навигация** - роль-ориентированное меню
- ✅ **Header с навигацией** - кликабельные аватары для перехода к профилю
- ✅ **Модальные окна** - удобное редактирование пользователей
- ✅ **ProtectedRoute** - защита маршрутов по ролям
- ✅ **Система ролей** - ADMIN, ORGANIZER, USER

#### **Мобильное приложение (Mobile-first):**
- ✅ **Базовая архитектура** - MobileApp.tsx с маршрутизацией
- ✅ **BottomNavigation** - навигация между Home, Search, Map
- ✅ **Cover страница** - стартовая страница
- ✅ **Страницы-заглушки** - готовы для интеграции с API (Home, Search, Map, ActivityDetail)

#### **Система аутентификации:**
- ✅ **AuthContext** - глобальное управление состоянием
- ✅ **JWT токены** - безопасное хранение сессий
- ✅ **Role-based access** - доступ по ролям пользователей
- ✅ **Исправлены критические баги** - роли читаются из user_profiles, а не метаданных

### 🔄 **В процессе разработки:**

#### **Мобильное приложение:**
- ⏳ **Home страница** - список активностей с infinite scroll
- ⏳ **Search страница** - поиск с фильтрами
- ⏳ **Map страница** - карта с активностями (планируется интеграция с БД)
- ⏳ **ActivityDetail страница** - детальная информация об активности
- ⏳ **Login/SignUp** - мобильная аутентификация
- ⏳ **Интеграция с API** - загрузка данных в мобильных страницах

### 🏗️ **Архитектурные достижения:**

1. **✅ Максимальное разделение** - mobile и admin компоненты полностью изолированы
2. **✅ Готовность к извлечению** - shared библиотека легко переносима
3. **✅ API универсальность** - REST API работает для любых клиентов
4. **✅ Типобезопасность** - полная TypeScript типизация
5. **✅ Документированность** - каждый компонент и API метод документирован

### 📊 **Прогресс по компонентам:**
- **Админ-панель**: ✅ **95%** - почти полностью готова
- **Мобильное приложение**: 🔄 **25%** - базовая структура готова
- **API и Backend**: ✅ **100%** - полностью готово
- **Shared инфраструктура**: ✅ **100%** - готово

**Общий прогресс: ~85% готово** 🚀

### 🎯 **Недавние достижения (Сентябрь 2025):**
- ✅ **Полная админ-панель пользователей** - поиск, редактирование, управление ролями
- ✅ **Исправлен поиск в Users** - правильная обработка `or` параметра в PostgREST
- ✅ **Модальные окна редактирования** - полноценные формы для обновления пользователей
- ✅ **Кликабельные аватары пользователей** - навигация к профилю из хедера
- ✅ **Управление активностями** - создание, редактирование, удаление активностей
- ✅ **Многошаговая регистрация** - формы для организаций с загрузкой фото
- ✅ **Улучшена архитектура API** - универсальный подход без vendor lock-in

### 🚀 **Следующие шаги:**
1. **Завершить мобильное приложение** - интеграция всех страниц с API
2. **Map страница с реальной картой** - показ активностей на карте
3. **Мобильная аутентификация** - адаптированные под мобильные устройства формы
4. **Infinite scroll** - для списка активностей в мобильном приложении
5. **Тестирование и оптимизация** - финальная проверка перед деплоем

---

**Последнее обновление**: 17 сентября 2025
**Версия**: 0.85 (85% готовности к MVP)