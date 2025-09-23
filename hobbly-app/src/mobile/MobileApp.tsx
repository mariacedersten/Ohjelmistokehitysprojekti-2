/**
 * @fileoverview Главный компонент мобильного приложения
 * @module mobile/MobileApp
 * @description Управляет маршрутизацией и основной структурой мобильного приложения
 */

import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import styles from './MobileApp.module.css';

// Импорт страниц
import Cover from './pages/Cover/Cover';
import Home from './pages/Home/Home';
import Search from './pages/Search/Search';
import Map from './pages/Map/Map';
import ActivityDetail from './pages/ActivityDetail/ActivityDetail';
import Login from './pages/Login/Login';
import SignUp from './pages/SignUp/SignUp';
import { UserRole } from '../types';

// Импорт компонентов
import BottomNavigation from './components/BottomNavigation/BottomNavigation';

const MobileApp: React.FC = () => {
  const location = useLocation();

  // Нужно ли показывать нижнюю навигацию
  const showBottomNav = ![
    '/mobile/cover',
    '/mobile/login',
    '/mobile/signup'
  ].includes(location.pathname);

  const hiddenPaths = ['/mobile/cover', '/mobile/login', '/mobile/signup'];
  const hideFooterAndPadding = hiddenPaths.includes(location.pathname);

  const userRole: UserRole = UserRole.USER;

  return (
    <div
      className={styles.mobileApp}
      style={{
        paddingBottom: hideFooterAndPadding ? 0 : '60px',
      }}
    >
      <Routes>
        {/* Стартовая страница */}
        <Route path="/cover" element={<Cover />} />

        {/* Гостевой режим */}
        <Route path="/home" element={<Home />} />
        <Route path="/search" element={<Search />} />
        <Route path="/map" element={<Map />} />
        <Route path="/activity/:id" element={<ActivityDetail />} />

        {/* Страница авторизации */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Маршруты для мобильного пользователя */}
        {userRole === UserRole.USER && (
          <>
            <Route path="/sidemenu" element={<div className={styles.placeholder}>Side Menu (Page under development)</div>} />
            <Route path="/personalinfo" element={<div className={styles.placeholder}>Personal Info (Page under development)</div>} />
            <Route path="/myactivities" element={<div className={styles.placeholder}>My Activities (Page under development)</div>} />
            <Route path="/settings" element={<div className={styles.placeholder}>Settings (Page under development)</div>} />
          </>
        )}

        {/* Редиректы */}
        <Route path="/" element={<Navigate to="/mobile/cover" replace />} />
        <Route path="*" element={<Navigate to="/mobile/cover" replace />} />
      </Routes>

      {showBottomNav && <BottomNavigation />}
    </div>
  );
};

export default MobileApp;
