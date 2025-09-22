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
// TODO: Импортировать когда будут созданы
// import Login from './pages/Login/Login';
// import SignUp from './pages/SignUp/SignUp';

// Импорт компонентов
import BottomNavigation from './components/BottomNavigation/BottomNavigation';

/**
 * Главный компонент мобильного приложения
 * @component
 * @returns {JSX.Element} Мобильное приложение с маршрутизацией
 */
const MobileApp: React.FC = () => {
  const location = useLocation();
  
  // Определяем, нужно ли показывать нижнюю навигацию
  const showBottomNav = ![
    '/mobile/cover',
    '/mobile/login',
    '/mobile/signup'
  ].includes(location.pathname);

  // Пути, на которых не нужен футер и padding
  const hiddenPaths = ['/mobile/cover', '/mobile/login', '/mobile/signup'];

      // Проверяем, нужно ли скрывать футер и padding
  const hideFooterAndPadding = hiddenPaths.includes(location.pathname);

  return (
    <div     className={styles.mobileApp}
      style={{
        // Если мы на Cover/Login/Signup — padding снизу 0
        paddingBottom: hideFooterAndPadding ? 0 : '60px',
      }}
    >
      <Routes>
        {/* Стартовая страница */}
        <Route path="/cover" element={<Cover />} />
        
        {/* Публичные маршруты (пока заглушки) */}
        
        <Route path="/signup" element={<div className={styles.placeholder}>SignUp Page (В разработке)</div>} />
        
        {/* Гостевой режим - доступно без авторизации */}
        <Route path="/home" element={<Home />} /> 
        <Route path="/search" element={<Search />} /> 
        <Route path="/map" element={<Map />} /> 
        <Route path="/activity/:id" element={<ActivityDetail />} /> 
        
        {/* Редирект с корня на стартовую страницу */}
        <Route path="/" element={<Navigate to="/cover" replace />} />
        {/* Редирект для неизвестных маршрутов */}
        <Route path="*" element={<Navigate to="/cover" replace />} />

        <Route path="/login" element={<Login />} />
      </Routes>
      
      {/* Нижняя навигация (показывается только на основных страницах) */}
      {showBottomNav && <BottomNavigation />}
    </div>
  );
};

export default MobileApp;
