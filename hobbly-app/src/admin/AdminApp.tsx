/**
 * @fileoverview Главный компонент админ-панели
 * @module admin/AdminApp
 * @description Управляет маршрутизацией и основной структурой админ-панели
 */

import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ProtectedRoute } from '../shared/components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Welcome from './pages/Welcome';
import Dashboard from './pages/Dashboard';
import { UserRole } from '../types';
import styles from './AdminApp.module.css';

// TODO: Import remaining pages when created
// import Welcome from './pages/Welcome';
// import SignUp from './pages/SignUp';
// import Dashboard from './pages/Dashboard';
// import Activities from './pages/Activities';
// import Profile from './pages/Profile';
// import Users from './pages/Users';
// import Trash from './pages/Trash';

/**
 * Главный компонент админ-панели
 * @component
 * @returns {JSX.Element} Админ-панель с маршрутизацией
 */
const AdminApp: React.FC = () => {
  const location = useLocation();

  // Public routes that don't need sidebar
  const isPublicRoute = (
    location.pathname === '/admin' ||
    location.pathname === '/admin/' ||
    location.pathname === '/admin/login' ||
    location.pathname === '/admin/signup'
  );

  if (isPublicRoute) {
    return (
      <div className={styles.adminApp}>
        <div className={styles.fullContent}>
          <Routes>
            {/* Публичные маршруты */}
            <Route path="/" element={<Welcome />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            
            {/* Редирект для неизвестных маршрутов */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.adminApp}>
      <Sidebar />
      
      <div className={styles.mainContent}>
        <Routes>
          {/* Защищенные маршруты */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute allowedRoles={[UserRole.ORGANIZER, UserRole.ADMIN]} redirectTo="/admin/login">
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/activities" 
            element={
              <ProtectedRoute allowedRoles={[UserRole.ORGANIZER, UserRole.ADMIN]} redirectTo="/admin/login">
                <div>Activities Management Page (TODO)</div>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/activities/new" 
            element={
              <ProtectedRoute allowedRoles={[UserRole.ORGANIZER, UserRole.ADMIN]} redirectTo="/admin/login">
                <div>New Activity Form (TODO)</div>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/activities/edit/:id" 
            element={
              <ProtectedRoute allowedRoles={[UserRole.ORGANIZER, UserRole.ADMIN]} redirectTo="/admin/login">
                <div>Edit Activity Form (TODO)</div>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/activities/trash" 
            element={
              <ProtectedRoute allowedRoles={[UserRole.ORGANIZER, UserRole.ADMIN]} redirectTo="/admin/login">
                <div>Trash Bin Page (TODO)</div>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/users" 
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]} redirectTo="/admin/login">
                <div>Users Management Page (TODO)</div>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/personal-info" 
            element={
              <ProtectedRoute allowedRoles={[UserRole.ORGANIZER, UserRole.ADMIN]} redirectTo="/admin/login">
                <div>Personal Info Page (TODO)</div>
              </ProtectedRoute>
            } 
          />
          
          {/* Редирект для неизвестных маршрутов */}
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default AdminApp;
