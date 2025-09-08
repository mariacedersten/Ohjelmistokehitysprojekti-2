/**
 * @fileoverview API сервис для аутентификации пользователей
 * @module api/auth
 * @description Обеспечивает функции регистрации, входа, выхода и управления профилем
 * через Supabase REST API
 */

import { authClient, setAuthToken, removeAuthToken } from './config';
import { User, SignInFormData, SignUpFormData, UserRole } from '../types';
import { AxiosResponse } from 'axios';

/**
 * Интерфейс ответа при успешной аутентификации
 */
interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  user: SupabaseUser;
}

/**
 * Интерфейс пользователя Supabase
 */
interface SupabaseUser {
  id: string;
  email: string;
  email_confirmed_at?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
  user_metadata?: {
    fullName?: string;
    organizationName?: string;
    role?: UserRole;
  };
}

/**
 * Преобразование пользователя Supabase в локальный формат
 * @param {SupabaseUser} supabaseUser - Пользователь из Supabase
 * @returns {User} Преобразованный пользователь
 */
const transformUser = (supabaseUser: SupabaseUser): User => {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    role: supabaseUser.user_metadata?.role || UserRole.USER,
    organizationName: supabaseUser.user_metadata?.organizationName,
    fullName: supabaseUser.user_metadata?.fullName,
    phone: supabaseUser.phone,
    createdAt: new Date(supabaseUser.created_at),
    updatedAt: new Date(supabaseUser.updated_at)
  };
};

/**
 * Класс для работы с аутентификацией
 * @class
 */
class AuthAPI {
  /**
   * Регистрация нового пользователя
   * @param {SignUpFormData} data - Данные для регистрации
   * @returns {Promise<User>} Зарегистрированный пользователь
   * @throws {ApiError} Ошибка регистрации
   * 
   * @example
   * const user = await authAPI.signUp({
   *   email: 'user@example.com',
   *   password: 'securePassword123',
   *   fullName: 'John Doe',
   *   organizationName: 'Sport Club',
   *   agreeToTerms: true
   * });
   */
  async signUp(data: SignUpFormData): Promise<User> {
    try {
      // Определяем роль: если есть организация - организатор, иначе - пользователь
      const role = data.organizationName ? UserRole.ORGANIZER : UserRole.USER;

      // Подготавливаем метаданные пользователя
      const userMetadata = {
        fullName: data.fullName,
        organizationName: data.organizationName,
        role: role
      };

      // Отправляем запрос на регистрацию
      const response: AxiosResponse<AuthResponse> = await authClient.post('/signup', {
        email: data.email,
        password: data.password,
        phone: data.phone,
        data: userMetadata // Метаданные сохраняются в user_metadata
      });

      // Сохраняем токен
      if (response.data.access_token) {
        setAuthToken(response.data.access_token);
      }

      // Возвращаем преобразованного пользователя
      return transformUser(response.data.user);
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      throw error;
    }
  }

  /**
   * Вход пользователя в систему
   * @param {SignInFormData} data - Данные для входа
   * @returns {Promise<User>} Авторизованный пользователь
   * @throws {ApiError} Ошибка входа
   * 
   * @example
   * const user = await authAPI.signIn({
   *   email: 'user@example.com',
   *   password: 'securePassword123',
   *   rememberMe: true
   * });
   */
  async signIn(data: SignInFormData): Promise<User> {
    try {
      // Отправляем запрос на вход
      const response: AxiosResponse<AuthResponse> = await authClient.post('/token?grant_type=password', {
        email: data.email,
        password: data.password
      });

      // Сохраняем токен
      if (response.data.access_token) {
        setAuthToken(response.data.access_token);
        
        // Если "Запомнить меня" - сохраняем refresh token
        if (data.rememberMe && response.data.refresh_token) {
          localStorage.setItem('refresh_token', response.data.refresh_token);
        }
      }

      // Возвращаем преобразованного пользователя
      return transformUser(response.data.user);
    } catch (error) {
      console.error('Ошибка входа:', error);
      throw error;
    }
  }

  /**
   * Выход пользователя из системы
   * @returns {Promise<void>}
   * @throws {ApiError} Ошибка выхода
   * 
   * @example
   * await authAPI.signOut();
   */
  async signOut(): Promise<void> {
    try {
      // Отправляем запрос на выход
      await authClient.post('/logout');
      
      // Удаляем токены
      removeAuthToken();
      localStorage.removeItem('refresh_token');
    } catch (error) {
      console.error('Ошибка выхода:', error);
      // Даже если запрос не удался, очищаем локальные токены
      removeAuthToken();
      localStorage.removeItem('refresh_token');
      throw error;
    }
  }

  /**
   * Получение текущего пользователя
   * @returns {Promise<User>} Текущий пользователь
   * @throws {ApiError} Ошибка получения пользователя
   * 
   * @example
   * const currentUser = await authAPI.getCurrentUser();
   */
  async getCurrentUser(): Promise<User> {
    try {
      // Получаем данные текущего пользователя
      const response: AxiosResponse<{ user: SupabaseUser }> = await authClient.get('/user');
      
      return transformUser(response.data.user);
    } catch (error) {
      console.error('Ошибка получения текущего пользователя:', error);
      throw error;
    }
  }

  /**
   * Обновление профиля пользователя
   * @param {Partial<User>} data - Данные для обновления
   * @returns {Promise<User>} Обновленный пользователь
   * @throws {ApiError} Ошибка обновления профиля
   * 
   * @example
   * const updatedUser = await authAPI.updateProfile({
   *   fullName: 'Jane Doe',
   *   phone: '+1234567890'
   * });
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    try {
      // Подготавливаем данные для обновления
      const updateData: any = {};
      
      if (data.phone) {
        updateData.phone = data.phone;
      }
      
      if (data.fullName || data.organizationName || data.role) {
        updateData.data = {};
        if (data.fullName) updateData.data.fullName = data.fullName;
        if (data.organizationName) updateData.data.organizationName = data.organizationName;
        if (data.role) updateData.data.role = data.role;
      }

      // Отправляем запрос на обновление
      const response: AxiosResponse<{ user: SupabaseUser }> = await authClient.put('/user', updateData);
      
      return transformUser(response.data.user);
    } catch (error) {
      console.error('Ошибка обновления профиля:', error);
      throw error;
    }
  }

  /**
   * Смена пароля пользователя
   * @param {string} newPassword - Новый пароль
   * @returns {Promise<void>}
   * @throws {ApiError} Ошибка смены пароля
   * 
   * @example
   * await authAPI.changePassword('newSecurePassword123');
   */
  async changePassword(newPassword: string): Promise<void> {
    try {
      // Отправляем запрос на смену пароля
      await authClient.put('/user', {
        password: newPassword
      });
    } catch (error) {
      console.error('Ошибка смены пароля:', error);
      throw error;
    }
  }

  /**
   * Запрос на сброс пароля
   * @param {string} email - Email для сброса пароля
   * @returns {Promise<void>}
   * @throws {ApiError} Ошибка запроса сброса пароля
   * 
   * @example
   * await authAPI.requestPasswordReset('user@example.com');
   */
  async requestPasswordReset(email: string): Promise<void> {
    try {
      // Отправляем запрос на сброс пароля
      await authClient.post('/recover', {
        email: email
      });
    } catch (error) {
      console.error('Ошибка запроса сброса пароля:', error);
      throw error;
    }
  }

  /**
   * Подтверждение email адреса
   * @param {string} token - Токен подтверждения
   * @returns {Promise<User>} Пользователь с подтвержденным email
   * @throws {ApiError} Ошибка подтверждения email
   * 
   * @example
   * const user = await authAPI.verifyEmail('verification-token');
   */
  async verifyEmail(token: string): Promise<User> {
    try {
      // Отправляем запрос на подтверждение email
      const response: AxiosResponse<AuthResponse> = await authClient.post('/verify', {
        type: 'signup',
        token: token
      });

      // Сохраняем токен
      if (response.data.access_token) {
        setAuthToken(response.data.access_token);
      }

      return transformUser(response.data.user);
    } catch (error) {
      console.error('Ошибка подтверждения email:', error);
      throw error;
    }
  }

  /**
   * Обновление токена с помощью refresh token
   * @returns {Promise<string>} Новый access token
   * @throws {ApiError} Ошибка обновления токена
   * 
   * @example
   * const newToken = await authAPI.refreshToken();
   */
  async refreshToken(): Promise<string> {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (!refreshToken) {
        throw new Error('Refresh token не найден');
      }

      // Отправляем запрос на обновление токена
      const response: AxiosResponse<AuthResponse> = await authClient.post('/token?grant_type=refresh_token', {
        refresh_token: refreshToken
      });

      // Сохраняем новый токен
      if (response.data.access_token) {
        setAuthToken(response.data.access_token);
        
        // Обновляем refresh token если он пришел
        if (response.data.refresh_token) {
          localStorage.setItem('refresh_token', response.data.refresh_token);
        }
      }

      return response.data.access_token;
    } catch (error) {
      console.error('Ошибка обновления токена:', error);
      // При ошибке обновления токена выходим из системы
      removeAuthToken();
      localStorage.removeItem('refresh_token');
      throw error;
    }
  }

  /**
   * Проверка валидности текущей сессии
   * @returns {Promise<boolean>} true если сессия валидна
   * 
   * @example
   * const isValid = await authAPI.isSessionValid();
   */
  async isSessionValid(): Promise<boolean> {
    try {
      await this.getCurrentUser();
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Создаем и экспортируем единственный экземпляр
const authAPI = new AuthAPI();
export default authAPI;
