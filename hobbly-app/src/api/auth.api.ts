/**
 * @fileoverview API сервис для аутентификации пользователей
 * @module api/auth
 * @description Обеспечивает функции регистрации, входа, выхода и управления профилем
 * через Supabase REST API
 */

import { authClient, apiClient, setAuthToken, removeAuthToken } from './config';
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
 * Интерфейс ответа для методов аутентификации
 */
interface AuthResult {
  user: User;
  token: string;
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
    isApproved?: boolean;
  };
}

/**
 * Преобразование профиля пользователя из таблицы user_profiles в локальный формат
 * @param {any} profile - Профиль из таблицы user_profiles
 * @returns {User} Преобразованный пользователь
 */
const transformUserProfile = (profile: any): User => {
  console.log('transformUserProfile input:', profile);
  
  const user: User = {
    id: profile.id,
    email: profile.email,
    role: profile.role as UserRole, // РОЛЬ ИЗ ТАБЛИЦЫ user_profiles!
    organizationName: profile.organization_name,
    fullName: profile.full_name,
    phone: profile.phone,
    isApproved: profile.isApproved || false,
    createdAt: new Date(profile.created_at),
    updatedAt: new Date(profile.updated_at)
  };
  
  console.log('transformUserProfile output:', user);
  return user;
};

/**
 * Класс для работы с аутентификацией
 * @class
 */
class AuthAPI {
  /**
   * Регистрация нового пользователя
   * @param {SignUpFormData} data - Данные для регистрации
   * @returns {Promise<AuthResult>} Результат регистрации с пользователем и токеном
   * @throws {ApiError} Ошибка регистрации
   * 
   * @example
   * const result = await authAPI.signUp({
   *   email: 'user@example.com',
   *   password: 'securePassword123',
   *   fullName: 'John Doe',
   *   organizationName: 'Sport Club',
   *   agreeToTerms: true
   * });
   */
  async signUp(data: SignUpFormData): Promise<AuthResult> {
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

      // Получаем профиль пользователя из user_profiles
      const userId = response.data.user.id;
      const profileResponse = await apiClient.get(`/user_profiles?id=eq.${userId}&select=*`);
      
      if (!profileResponse.data || profileResponse.data.length === 0) {
        throw new Error('Профиль пользователя не создан');
      }

      // Возвращаем результат с пользователем из user_profiles
      return {
        user: transformUserProfile(profileResponse.data[0]),
        token: response.data.access_token
      };
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      throw error;
    }
  }

  /**
   * Вход пользователя в систему
   * @param {SignInFormData} data - Данные для входа
   * @returns {Promise<AuthResult>} Результат входа с пользователем и токеном
   * @throws {ApiError} Ошибка входа
   * 
   * @example
   * const result = await authAPI.signIn({
   *   email: 'user@example.com',
   *   password: 'securePassword123',
   *   rememberMe: true
   * });
   */
  async signIn(data: SignInFormData): Promise<AuthResult> {
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

      // Получаем профиль пользователя из user_profiles
      const userId = response.data.user.id;
      const profileResponse = await apiClient.get(`/user_profiles?id=eq.${userId}&select=*`);
      
      if (!profileResponse.data || profileResponse.data.length === 0) {
        throw new Error('Профиль пользователя не найден');
      }

      // Возвращаем результат с пользователем из user_profiles
      return {
        user: transformUserProfile(profileResponse.data[0]),
        token: response.data.access_token
      };
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
      // Получаем базовые данные пользователя из auth
      const authResponse: AxiosResponse<{ user: SupabaseUser }> = await authClient.get('/user');
      
      console.log('Auth response:', authResponse.data);
      
      if (!authResponse.data || !authResponse.data.user) {
        throw new Error('Пользователь не найден в ответе сервера');
      }

      const userId = authResponse.data.user.id;
      console.log('Fetching profile for user ID:', userId);
      
      // ГЛАВНЫЙ ИСТОЧНИК ДАННЫХ - таблица user_profiles
      const profileResponse = await apiClient.get(`/user_profiles?id=eq.${userId}&select=*`);
      
      console.log('Profile response:', profileResponse.data);
      
      if (!profileResponse.data || profileResponse.data.length === 0) {
        throw new Error(`Профиль пользователя не найден в user_profiles для ID: ${userId}`);
      }
      
      const profile = profileResponse.data[0];
      
      // Используем новую функцию преобразования из user_profiles
      return transformUserProfile(profile);
      
    } catch (error) {
      console.error('Ошибка получения текущего пользователя:', error);
      removeAuthToken();
      localStorage.removeItem('auth_token');
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
      
      // Получаем обновленный профиль из user_profiles
      const userId = response.data.user.id;
      const profileResponse = await apiClient.get(`/user_profiles?id=eq.${userId}&select=*`);
      
      if (!profileResponse.data || profileResponse.data.length === 0) {
        throw new Error('Обновленный профиль не найден');
      }
      
      return transformUserProfile(profileResponse.data[0]);
    } catch (error) {
      console.error('Ошибка обновления профиля:', error);
      throw error;
    }
  }

  /**
   * Сброс пароля (для восстановления через email)
   * @param {string} newPassword - Новый пароль
   * @returns {Promise<void>}
   * @throws {ApiError} Ошибка сброса пароля
   * 
   * @example
   * await authAPI.resetPassword('newSecurePassword123');
   */
  async resetPassword(newPassword: string): Promise<void> {
    try {
      // Отправляем запрос на сброс пароля
      await authClient.put('/user', {
        password: newPassword
      });
    } catch (error) {
      console.error('Ошибка сброса пароля:', error);
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

      // Получаем профиль пользователя из user_profiles
      const userId = response.data.user.id;
      const profileResponse = await apiClient.get(`/user_profiles?id=eq.${userId}&select=*`);
      
      if (!profileResponse.data || profileResponse.data.length === 0) {
        throw new Error('Профиль пользователя не найден после подтверждения email');
      }

      return transformUserProfile(profileResponse.data[0]);
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

  /**
   * Изменение пароля
   * @param {string} oldPassword - Текущий пароль
   * @param {string} newPassword - Новый пароль
   * @returns {Promise<void>}
   * 
   * @example
   * await authAPI.changePassword('oldpass123', 'newpass456');
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    try {
      await authClient.post('/user', {
        password: newPassword,
        data: {
          old_password: oldPassword
        }
      });
    } catch (error) {
      console.error('Ошибка смены пароля:', error);
      throw error;
    }
  }
}

// Создаем и экспортируем единственный экземпляр
const authAPI = new AuthAPI();

export default authAPI;
export { authAPI };
export type { AuthResult };
