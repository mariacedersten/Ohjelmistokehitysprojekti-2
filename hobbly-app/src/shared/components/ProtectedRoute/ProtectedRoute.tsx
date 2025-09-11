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

  // Проверка одобрения пользователя (для организаторов)
  if (user && user.role === UserRole.ORGANIZER && !user.isApproved) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '20px',
        textAlign: 'center',
        backgroundColor: '#f8f9fa'
      }}>
        <div style={{
          backgroundColor: '#fff',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          maxWidth: '500px'
        }}>
          <h2 style={{ color: '#073B3A', marginBottom: '16px' }}>
            Account Pending Approval
          </h2>
          <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '24px' }}>
            Your organizer account is currently pending approval by our administrators. 
            You will receive an email notification once your account has been approved.
          </p>
          <button
            onClick={() => window.location.href = '/admin/login'}
            style={{
              backgroundColor: '#073B3A',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  // Проверка ролей
  if (allowedRoles && user) {
    console.log('ProtectedRoute role check:', { 
      currentPath: location.pathname,
      userRole: user.role, 
      userRoleType: typeof user.role,
      allowedRoles, 
      allowedRolesTypes: allowedRoles.map(r => typeof r),
      redirectTo: redirectTo
    });
    const hasRequiredRole = allowedRoles.includes(user.role);
    console.log('Role check result:', hasRequiredRole);
    
    if (!hasRequiredRole) {
      // Если нет нужной роли, редиректим на соответствующую страницу
      // Определяем, это админ-панель или мобильное приложение по redirectTo
      const isAdminPanel = redirectTo?.includes('/admin') || location.pathname.includes('/admin');
      
      if (isAdminPanel) {
        // Для админ-панели перенаправляем на логин админа
        return <Navigate to="/admin/login" replace />;
      } else {
        // Для мобильного приложения перенаправляем на мобильный логин
        return <Navigate to="/mobile/login" replace />;
      }
    }
  }

  // Если все проверки пройдены, показываем защищенный контент
  return <>{children}</>;
};

export default ProtectedRoute;
