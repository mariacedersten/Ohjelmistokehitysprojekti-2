/**
 * @fileoverview Главный компонент админ-панели
 * @module admin/AdminApp
 * @description Управляет маршрутизацией и основной структурой админ-панели
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import styles from './AdminApp.module.css';

// TODO: Import pages when created
// import Welcome from './pages/Welcome';
// import Login from './pages/Login';
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
  return (
    <div className={styles.adminApp}>
      {/* TODO: Add Sidebar component here */}
      
      <div className={styles.mainContent}>
        <Routes>
          {/* Публичные маршруты */}
          <Route path="/" element={<div>Admin Welcome/Landing Page (TODO)</div>} />
          <Route path="/login" element={<div>Admin Login Page (TODO)</div>} />
          <Route path="/signup" element={<div>Admin SignUp Page (TODO)</div>} />
          
          {/* Защищенные маршруты */}
          <Route path="/dashboard" element={<div>Dashboard Page (TODO)</div>} />
          <Route path="/activities" element={<div>Activities Management Page (TODO)</div>} />
          <Route path="/activities/new" element={<div>New Activity Form (TODO)</div>} />
          <Route path="/activities/edit/:id" element={<div>Edit Activity Form (TODO)</div>} />
          <Route path="/activities/trash" element={<div>Trash Bin Page (TODO)</div>} />
          <Route path="/users" element={<div>Users Management Page (TODO)</div>} />
          <Route path="/profile" element={<div>Personal Info Page (TODO)</div>} />
          
          {/* Редирект для неизвестных маршрутов */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
};

export default AdminApp;
