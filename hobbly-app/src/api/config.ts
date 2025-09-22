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
  // Log the full error for debugging purposes
  console.error('API Error Intercepted:', {
    message: error.message,
    code: error.code,
    status: error.response?.status,
    response: error.response?.data,
    request: {
      url: error.config?.url,
      method: error.config?.method,
      headers: error.config?.headers,
      data: error.config?.data,
    },
  });

  const apiError: ApiError = {
    code: error.code || 'UNKNOWN_ERROR',
    message: 'An unexpected error occurred. Please try again.',
    status: error.response?.status
  };

  if (error.response) {
    // Server responded with a status code that falls out of the range of 2xx
    apiError.status = error.response.status;
    const responseData = error.response.data as any;
    apiError.details = responseData;

    // Try to extract a more specific message from the response
    const serverMessage = responseData?.message || responseData?.msg || responseData?.error_description;
    const serverDetails = responseData?.details || responseData?.hint;

    switch (error.response.status) {
      case 400:
        apiError.message = serverMessage || 'Bad Request: The server could not understand the request due to invalid syntax.';
        break;
      case 401:
        apiError.message = serverMessage || 'Authentication Failed: You must be logged in to perform this action.';
        apiError.code = 'UNAUTHORIZED';
        // Remove token on auth error to prevent loops
        removeAuthToken();
        break;
      case 403:
        apiError.message = serverMessage || 'Forbidden: You do not have permission to access this resource.';
        apiError.code = 'FORBIDDEN';
        break;
      case 404:
        apiError.message = serverMessage || 'Not Found: The requested resource could not be found.';
        apiError.code = 'NOT_FOUND';
        break;
      case 409:
        apiError.message = serverMessage || 'Conflict: The request could not be completed due to a conflict with the current state of the resource (e.g., duplicate entry).';
        apiError.code = 'CONFLICT';
        break;
      case 422:
        apiError.message = serverMessage || 'Validation Error: The provided data is invalid.';
        apiError.code = 'VALIDATION_ERROR';
        break;
      case 500:
        apiError.message = serverMessage || 'Internal Server Error: Something went wrong on our end. Please try again later.';
        apiError.code = 'SERVER_ERROR';
        break;
      default:
        apiError.message = serverMessage || `Request failed with status code ${apiError.status}.`;
    }
    
    if (serverDetails && typeof serverDetails === 'string' && !apiError.message.includes(serverDetails)) {
      apiError.message += ` (${serverDetails})`;
    }

  } else if (error.request) {
    // The request was made but no response was received
    apiError.message = 'Network Error: No response received from the server. Please check your internet connection.';
    apiError.code = 'NETWORK_ERROR';
  } else {
    // Something happened in setting up the request that triggered an Error
    apiError.message = `Request Error: ${error.message}`;
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
      // Особая обработка для OR условий
      if (key === 'or' && typeof value === 'string') {
        params.append(key, value);
      }
      // Если значение уже содержит оператор PostgREST (например, 'is.false'), добавляем как есть
      else if (typeof value === 'string' && (value.startsWith('is.') || value.startsWith('eq.') || value.startsWith('ilike.') || value.startsWith('cs.') || value.startsWith('gte.') || value.startsWith('lte.'))) {
        params.append(key, value);
      } else if (Array.isArray(value)) {
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
