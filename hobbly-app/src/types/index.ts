/**
 * @fileoverview Основные типы данных для приложения Hobbly
 * @module types
 * @description Этот файл содержит все TypeScript интерфейсы и типы,
 * используемые во всем приложении для обеспечения типобезопасности
 */

/**
 * Роли пользователей в системе
 * @enum {string}
 */
export enum UserRole {
  /** Организатор мероприятий - может управлять только своими активностями */
  ORGANIZER = 'organizer',
  /** Администратор - полный доступ ко всем функциям */
  ADMIN = 'admin',
  /** Обычный пользователь - только просмотр */
  USER = 'user'
}

/**
 * Типы активностей/событий
 * @enum {string}
 */
export enum ActivityType {
  /** Регулярная активность */
  ACTIVITY = 'activity',
  /** Разовое мероприятие */
  EVENT = 'event',
  /** Возможность для хобби */
  HOBBY_OPPORTUNITY = 'hobby_opportunity',
  /** Клуб или секция */
  CLUB = 'club',
  /** Соревнование */
  COMPETITION = 'competition'
}

/**
 * Интерфейс пользователя
 * @interface
 */
export interface User {
  /** Уникальный идентификатор пользователя */
  id: string;
  /** Email пользователя */
  email: string;
  /** Роль пользователя в системе */
  role: UserRole;
  /** Название организации (для организаторов) */
  organizationName?: string;
  /** Полное имя пользователя */
  fullName?: string;
  /** Телефон для связи */
  phone?: string;
  /** Дата создания аккаунта */
  createdAt: Date;
  /** Дата последнего обновления */
  updatedAt: Date;
}

/**
 * Интерфейс категории активности
 * @interface
 */
export interface Category {
  /** Уникальный идентификатор категории */
  id: string;
  /** Название категории */
  name: string;
  /** Иконка категории (emoji или URL) */
  icon?: string;
  /** Описание категории */
  description?: string;
}

/**
 * Интерфейс тега
 * @interface
 */
export interface Tag {
  /** Уникальный идентификатор тега */
  id: string;
  /** Название тега */
  name: string;
  /** Цвет тега для отображения */
  color?: string;
}

/**
 * Интерфейс активности/мероприятия
 * @interface
 */
export interface Activity {
  /** Уникальный идентификатор активности */
  id: string;
  /** Заголовок активности */
  title: string;
  /** Полное описание */
  description: string;
  /** Краткое описание (до 100 символов) */
  shortDescription?: string;
  /** Тип активности */
  type: ActivityType;
  /** ID категории */
  categoryId: string;
  /** Категория (при загрузке с join) */
  category?: Category;
  /** Местоположение проведения */
  location: string;
  /** Адрес */
  address?: string;
  /** Координаты для карты */
  coordinates?: {
    lat: number;
    lng: number;
  };
  /** Цена участия */
  price?: number;
  /** Валюта цены */
  currency?: string;
  /** URL изображения */
  imageUrl?: string;
  /** ID организатора */
  userId: string;
  /** Организатор (при загрузке с join) */
  organizer?: User;
  /** Теги активности */
  tags?: Tag[];
  /** Дата и время начала */
  startDate?: Date;
  /** Дата и время окончания */
  endDate?: Date;
  /** Максимальное количество участников */
  maxParticipants?: number;
  /** Минимальный возраст участников */
  minAge?: number;
  /** Максимальный возраст участников */
  maxAge?: number;
  /** Контактный email */
  contactEmail?: string;
  /** Контактный телефон */
  contactPhone?: string;
  /** Ссылка на внешний сайт */
  externalLink?: string;
  /** Флаг удаления (для корзины) */
  isDeleted: boolean;
  /** Дата создания */
  createdAt: Date;
  /** Дата последнего обновления */
  updatedAt: Date;
}

/**
 * Параметры фильтрации активностей
 * @interface
 */
export interface ActivityFilters {
  /** Поиск по тексту */
  search?: string;
  /** Фильтр по категории */
  categoryId?: string;
  /** Фильтр по типу */
  type?: ActivityType;
  /** Фильтр по тегам */
  tags?: string[];
  /** Фильтр по местоположению */
  location?: string;
  /** Минимальная цена */
  minPrice?: number;
  /** Максимальная цена */
  maxPrice?: number;
  /** Только бесплатные */
  freeOnly?: boolean;
  /** Возрастная группа */
  ageGroup?: 'children' | 'teens' | 'adults' | 'seniors' | 'all';
}

/**
 * Параметры пагинации
 * @interface
 */
export interface PaginationParams {
  /** Номер страницы (начиная с 1) */
  page: number;
  /** Количество элементов на странице */
  limit: number;
  /** Общее количество элементов */
  total?: number;
}

/**
 * Ответ API со списком данных
 * @interface
 * @template T - Тип элементов в списке
 */
export interface ApiListResponse<T> {
  /** Массив данных */
  data: T[];
  /** Информация о пагинации */
  pagination: PaginationParams;
  /** Общее количество элементов */
  total: number;
}

/**
 * Ошибка API
 * @interface
 */
export interface ApiError {
  /** Код ошибки */
  code: string;
  /** Сообщение об ошибке */
  message: string;
  /** Детали ошибки */
  details?: any;
  /** HTTP статус код */
  status?: number;
}

/**
 * Данные формы регистрации
 * @interface
 */
export interface SignUpFormData {
  /** Email */
  email: string;
  /** Пароль */
  password: string;
  /** Подтверждение пароля */
  confirmPassword: string;
  /** Полное имя */
  fullName: string;
  /** Название организации */
  organizationName?: string;
  /** Телефон */
  phone?: string;
  /** Согласие с условиями */
  agreeToTerms: boolean;
}

/**
 * Данные формы входа
 * @interface
 */
export interface SignInFormData {
  /** Email */
  email: string;
  /** Пароль */
  password: string;
  /** Запомнить меня */
  rememberMe?: boolean;
}

/**
 * Данные формы активности
 * @interface
 */
export interface ActivityFormData {
  /** Заголовок */
  title: string;
  /** Описание */
  description: string;
  /** Тип активности */
  type: ActivityType;
  /** ID категории */
  categoryId: string;
  /** Местоположение */
  location: string;
  /** Адрес */
  address?: string;
  /** Цена */
  price?: number;
  /** Изображение */
  image?: File;
  /** Теги */
  tags: string[];
  /** Дата начала */
  startDate?: string;
  /** Дата окончания */
  endDate?: string;
  /** Максимальное количество участников */
  maxParticipants?: number;
  /** Минимальный возраст */
  minAge?: number;
  /** Максимальный возраст */
  maxAge?: number;
  /** Контактный email */
  contactEmail?: string;
  /** Контактный телефон */
  contactPhone?: string;
  /** Внешняя ссылка */
  externalLink?: string;
}

/**
 * Контекст аутентификации
 * @interface
 */
export interface AuthContextType {
  /** Текущий пользователь */
  user: User | null;
  /** Флаг загрузки */
  loading: boolean;
  /** Функция входа */
  signIn: (data: SignInFormData) => Promise<void>;
  /** Функция регистрации */
  signUp: (data: SignUpFormData) => Promise<void>;
  /** Функция выхода */
  signOut: () => Promise<void>;
  /** Функция обновления профиля */
  updateProfile: (data: Partial<User>) => Promise<void>;
  /** Функция смены пароля */
  changePassword: (oldPassword: string, newPassword: string) => Promise<void>;
}

/**
 * Предопределенные категории
 */
export const CATEGORIES: Omit<Category, 'id'>[] = [
  { name: 'Спорт и физическая активность', icon: '⚽' },
  { name: 'Музыка и исполнительское искусство', icon: '🎵' },
  { name: 'Ремесла и искусство', icon: '🎨' },
  { name: 'Наука и технологии', icon: '🔬' },
  { name: 'Игры и киберспорт', icon: '🎮' },
  { name: 'Еда и кулинария', icon: '🍳' },
  { name: 'Природа и туризм', icon: '🏕️' },
  { name: 'Культура и история', icon: '🏛️' },
  { name: 'Сообщество и добровольчество', icon: '🤝' },
  { name: 'Дети и семьи', icon: '👨‍👩‍👧‍👦' }
];

/**
 * Предопределенные теги
 */
export const TAGS: Omit<Tag, 'id'>[] = [
  { name: 'Бесплатно', color: '#65FF81' },
  { name: 'Открыто для всех', color: '#F5FF65' },
  { name: 'Подходит для начинающих', color: '#73B3FF' },
  { name: 'Постоянное событие', color: '#FF9473' },
  { name: 'Онлайн', color: '#B473FF' },
  { name: 'Подходит для семей', color: '#65FF81' },
  { name: 'Подходит для пожилых', color: '#F5FF65' },
  { name: 'Подходит для особых групп', color: '#73B3FF' },
  { name: 'Оборудование предоставляется', color: '#FF9473' },
  { name: 'Требуется регистрация', color: '#B473FF' }
];
