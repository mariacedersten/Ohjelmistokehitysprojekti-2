/**
 * @fileoverview Компонент защищенного маршрута
 * @module shared/components/ProtectedRoute
 * @description Обеспечивает защиту маршрутов с проверкой аутентификации и ролей
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../../types';
import { Loader } from '../Loader';

export interface ProtectedRouteProps {
  /**
   * Дочерние элементы для отображения
   */
  children: React.ReactNode;
  
  /**
   * Требуемые роли для доступа
   */
  allowedRoles?: UserRole[];
  
  /**
   * URL для редиректа при отсутствии доступа
   * @default '/login'
   */
  redirectTo?: string;
  
  /**
   * Требовать аутентификацию
   * @default true
   */
  requireAuth?: boolean;
}

/**
 * Компонент защищенного маршрута с проверкой аутентификации и ролей
 * @component
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  redirectTo = '/login',
  requireAuth = true
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Показываем загрузчик пока проверяем аутентификацию
  if (loading) {
    return <Loader fullScreen text="Проверка доступа..." />;
  }

  // Проверка аутентификации
  if (requireAuth && !user) {
    // Сохраняем путь, с которого был редирект, чтобы вернуться после входа
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Проверка ролей
  if (allowedRoles && user) {
    const hasRequiredRole = allowedRoles.includes(user.role);
    
    if (!hasRequiredRole) {
      // Если нет нужной роли, редиректим на страницу без доступа или главную
      const unauthorizedPath = user.role === UserRole.ADMIN ? '/admin/dashboard' : 
                             user.role === UserRole.ORGANIZER ? '/admin/activities' : 
                             '/mobile';
      return <Navigate to={unauthorizedPath} replace />;
    }
  }

  // Если все проверки пройдены, показываем защищенный контент
  return <>{children}</>;
};

export default ProtectedRoute;
