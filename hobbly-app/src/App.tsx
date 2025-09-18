/**
 * @fileoverview Главный компонент приложения
 * @module App
 * @description Управляет маршрутизацией между мобильным приложением и админ-панелью
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './shared/contexts/AuthContext';
import MobileApp from './mobile/MobileApp';
import AdminApp from './admin/AdminApp';
import LandingPage from './pages/LandingPage';
import './App.css';

/**
 * Главный компонент приложения
 * @component
 * @returns {JSX.Element} Приложение с маршрутизацией
 */
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Лендинг страница с выбором интерфейса */}
          <Route path="/" element={<LandingPage />} />

          {/* Мобильное приложение (mobile-first) */}
          <Route path="/mobile/*" element={<MobileApp />} />

          {/* Админ-панель (desktop-first) */}
          <Route path="/admin/*" element={<AdminApp />} />

          {/* Редирект для всех остальных путей на лендинг */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
