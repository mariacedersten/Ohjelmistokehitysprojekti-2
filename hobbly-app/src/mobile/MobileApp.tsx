/**
 * @fileoverview Главный компонент мобильного приложения
 * @module mobile/MobileApp
 * @description Управляет маршрутизацией и основной структурой мобильного приложения
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import styles from './MobileApp.module.css';

// TODO: Import pages when created
// import Home from './pages/Home';
// import Search from './pages/Search';
// import Map from './pages/Map';
// import ActivityDetail from './pages/ActivityDetail';
// import Login from './pages/Login';
// import SignUp from './pages/SignUp';

/**
 * Главный компонент мобильного приложения
 * @component
 * @returns {JSX.Element} Мобильное приложение с маршрутизацией
 */
const MobileApp: React.FC = () => {
  return (
    <div className={styles.mobileApp}>
      <Routes>
        {/* Публичные маршруты */}
        <Route path="/login" element={<div>Mobile Login Page (TODO)</div>} />
        <Route path="/signup" element={<div>Mobile SignUp Page (TODO)</div>} />
        
        {/* Защищенные маршруты */}
        <Route path="/" element={<div>Mobile Home Page (TODO)</div>} />
        <Route path="/search" element={<div>Mobile Search Page (TODO)</div>} />
        <Route path="/map" element={<div>Mobile Map Page (TODO)</div>} />
        <Route path="/activity/:id" element={<div>Activity Detail Page (TODO)</div>} />
        
        {/* Редирект для неизвестных маршрутов */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      {/* TODO: Add BottomNavigation component here */}
    </div>
  );
};

export default MobileApp;
