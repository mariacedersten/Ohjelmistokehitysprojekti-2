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
          {/* Мобильное приложение (mobile-first) */}
          <Route path="/mobile/*" element={<MobileApp />} />
          
          {/* Админ-панель (desktop-first) */}
          <Route path="/admin/*" element={<AdminApp />} />
          
          {/* Редирект с корневого пути на мобильную версию */}
          <Route path="/" element={<Navigate to="/mobile" replace />} />
          
          {/* Редирект для всех остальных путей */}
          <Route path="*" element={<Navigate to="/mobile" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
