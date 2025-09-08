/**
 * @fileoverview Конфигурация REST API для работы с Supabase
 * @module api/config
 * @description Базовая конфигурация для всех API запросов.
 * Использует axios для HTTP запросов и обеспечивает универсальность
 * при возможной смене бэкенда.
 */

import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { ApiError } from '../types';

/**
 * Базовый URL Supabase проекта
 * @constant
 */
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || '';

/**
 * Публичный анонимный ключ Supabase
 * @constant
 */
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

/**
 * Проверка наличия необходимых переменных окружения
 */
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Отсутствуют необходимые переменные окружения для Supabase');
  console.error('Убедитесь, что REACT_APP_SUPABASE_URL и REACT_APP_SUPABASE_ANON_KEY установлены в .env файле');
}

/**
 * Создание экземпляра axios для REST API
 * @description Базовый клиент для всех запросов к Supabase REST API
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: `${SUPABASE_URL}/rest/v1`,
  headers: {
    'apikey': SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation' // Возвращать обновленные данные после мутаций
  }
});

/**
 * Создание экземпляра axios для Auth API
 * @description Клиент для работы с аутентификацией Supabase
 */
export const authClient: AxiosInstance = axios.create({
  baseURL: `${SUPABASE_URL}/auth/v1`,
  headers: {
    'apikey': SUPABASE_ANON_KEY,
    'Content-Type': 'application/json'
  }
});

/**
 * Создание экземпляра axios для Storage API
 * @description Клиент для работы с файловым хранилищем Supabase
 */
export const storageClient: AxiosInstance = axios.create({
  baseURL: `${SUPABASE_URL}/storage/v1`,
  headers: {
    'apikey': SUPABASE_ANON_KEY
  }
});

/**
 * Получение токена из localStorage
 * @returns {string | null} JWT токен или null
 */
const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

/**
 * Сохранение токена в localStorage
 * @param {string} token - JWT токен
 */
export const setAuthToken = (token: string): void => {
  localStorage.setItem('auth_token', token);
};

/**
 * Удаление токена из localStorage
 */
export const removeAuthToken = (): void => {
  localStorage.removeItem('auth_token');
};

/**
 * Interceptor для добавления токена авторизации к запросам
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

authClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token && !config.url?.includes('/signup') && !config.url?.includes('/token')) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

storageClient.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Interceptor для обработки ошибок
 * @description Преобразует ошибки axios в стандартизированный формат ApiError
 */
const errorInterceptor = (error: AxiosError): Promise<ApiError> => {
  const apiError: ApiError = {
    code: error.code || 'UNKNOWN_ERROR',
    message: 'Произошла неизвестная ошибка',
    status: error.response?.status
  };

  if (error.response) {
    // Ошибка от сервера
    apiError.status = error.response.status;
    apiError.details = error.response.data;

    switch (error.response.status) {
      case 400:
        apiError.message = 'Неверный запрос';
        break;
      case 401:
        apiError.message = 'Необходима авторизация';
        apiError.code = 'UNAUTHORIZED';
        // Удаляем токен при ошибке авторизации
        removeAuthToken();
        break;
      case 403:
        apiError.message = 'Доступ запрещен';
        apiError.code = 'FORBIDDEN';
        break;
      case 404:
        apiError.message = 'Ресурс не найден';
        apiError.code = 'NOT_FOUND';
        break;
      case 409:
        apiError.message = 'Конфликт данных';
        apiError.code = 'CONFLICT';
        break;
      case 422:
        apiError.message = 'Неверные данные';
        apiError.code = 'VALIDATION_ERROR';
        break;
      case 500:
        apiError.message = 'Ошибка сервера';
        apiError.code = 'SERVER_ERROR';
        break;
      default:
        const responseData = error.response.data as any;
        apiError.message = responseData?.message || 'Произошла ошибка';
    }
  } else if (error.request) {
    // Запрос был отправлен, но ответ не получен
    apiError.message = 'Нет ответа от сервера';
    apiError.code = 'NETWORK_ERROR';
  } else {
    // Ошибка при настройке запроса
    apiError.message = error.message;
    apiError.code = 'REQUEST_ERROR';
  }

  return Promise.reject(apiError);
};

// Применяем interceptor для обработки ошибок ко всем клиентам
apiClient.interceptors.response.use(
  (response) => response,
  errorInterceptor
);

authClient.interceptors.response.use(
  (response) => response,
  errorInterceptor
);

storageClient.interceptors.response.use(
  (response) => response,
  errorInterceptor
);

/**
 * Вспомогательные функции для построения запросов
 */

/**
 * Построение строки фильтров для Supabase PostgREST
 * @param {Record<string, any>} filters - Объект с фильтрами
 * @returns {string} Строка параметров для URL
 */
export const buildFilterQuery = (filters: Record<string, any>): string => {
  const params = new URLSearchParams();
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        // Для массивов используем оператор cs (contains)
        params.append(key, `cs.{${value.join(',')}}`);
      } else if (typeof value === 'boolean') {
        params.append(key, `is.${value}`);
      } else if (typeof value === 'string' && key.includes('search')) {
        // Для текстового поиска используем оператор ilike
        params.append(key, `ilike.*${value}*`);
      } else {
        params.append(key, `eq.${value}`);
      }
    }
  });

  return params.toString();
};

/**
 * Построение параметров для пагинации
 * @param {number} page - Номер страницы (начиная с 1)
 * @param {number} limit - Количество элементов на странице
 * @returns {AxiosRequestConfig} Конфигурация для axios
 */
export const buildPaginationConfig = (page: number, limit: number): AxiosRequestConfig => {
  const offset = (page - 1) * limit;
  
  return {
    headers: {
      'Range': `${offset}-${offset + limit - 1}`,
      'Range-Unit': 'items',
      'Prefer': 'count=exact' // Возвращать общее количество записей
    }
  };
};

/**
 * Построение параметров сортировки
 * @param {string} field - Поле для сортировки
 * @param {boolean} ascending - По возрастанию (true) или убыванию (false)
 * @returns {string} Строка параметра order для PostgREST
 */
export const buildOrderQuery = (field: string, ascending: boolean = true): string => {
  return `${field}.${ascending ? 'asc' : 'desc'}`;
};

/**
 * Экспорт URL-ов для прямого использования
 */
export const API_URLS = {
  BASE: SUPABASE_URL,
  REST: `${SUPABASE_URL}/rest/v1`,
  AUTH: `${SUPABASE_URL}/auth/v1`,
  STORAGE: `${SUPABASE_URL}/storage/v1`,
  REALTIME: `${SUPABASE_URL}/realtime/v1`
};

/**
 * Константы для API
 */
export const API_CONSTANTS = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_TIMEOUT: 30000, // 30 секунд
  STORAGE_BUCKET: 'activities' // Название bucket для изображений активностей
};

export default apiClient;
