/**
 * @fileoverview Контекст аутентификации
 * @module shared/contexts/AuthContext
 * @description Управляет состоянием аутентификации и предоставляет методы для работы с пользователями
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../../api/auth.api';
import { setAuthToken, removeAuthToken } from '../../api/config';
import { 
  User, 
  SignInFormData, 
  SignUpFormData, 
  AuthContextType 
} from '../../types';

/**
 * Контекст аутентификации
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Провайдер контекста аутентификации
 * @component
 */
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Проверка текущей сессии при загрузке
   */
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      
      if (token) {
        try {
          setAuthToken(token);
          const userData = await authAPI.getCurrentUser();
          setUser(userData);
        } catch (error) {
          console.error('Failed to restore session:', error);
          removeAuthToken();
          localStorage.removeItem('auth_token');
        }
      }
      
      setLoading(false);
    };

    checkAuth();
  }, []);

  /**
   * Вход в систему
   */
  const signIn = useCallback(async (data: SignInFormData) => {
    try {
      setLoading(true);
      const response = await authAPI.signIn(data);
      
      if (response.token) {
        setAuthToken(response.token);
        localStorage.setItem('auth_token', response.token);
        
        if (data.rememberMe) {
          localStorage.setItem('remember_email', data.email);
        } else {
          localStorage.removeItem('remember_email');
        }
      }
      
      setUser(response.user);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Регистрация нового пользователя
   */
  const signUp = useCallback(async (data: SignUpFormData) => {
    try {
      setLoading(true);
      const response = await authAPI.signUp(data);
      
      if (response.token) {
        setAuthToken(response.token);
        localStorage.setItem('auth_token', response.token);
      }
      
      setUser(response.user);
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Выход из системы
   */
  const signOut = useCallback(async () => {
    try {
      setLoading(true);
      await authAPI.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      removeAuthToken();
      localStorage.removeItem('auth_token');
      setUser(null);
      setLoading(false);
    }
  }, []);

  /**
   * Обновление профиля пользователя
   */
  const updateProfile = useCallback(async (data: Partial<User> & { photo?: File }) => {
    if (!user) {
      throw new Error('No user logged in');
    }

    try {
      setLoading(true);
      const updatedUser = await authAPI.updateProfile(data);
      setUser(updatedUser);
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Смена пароля
   */
  const changePassword = useCallback(async (oldPassword: string, newPassword: string) => {
    if (!user) {
      throw new Error('No user logged in');
    }

    try {
      setLoading(true);
      await authAPI.changePassword(oldPassword, newPassword);
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    changePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Хук для использования контекста аутентификации
 * @throws {Error} Если используется вне AuthProvider
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

export default AuthContext;
