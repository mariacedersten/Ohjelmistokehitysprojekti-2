/**
 * @fileoverview BottomNavigation компонент для мобильного приложения
 * @module mobile/components/BottomNavigation
 * @description Нижняя навигация с тремя основными разделами
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './BottomNavigation.module.css';

/**
 * BottomNavigation компонент
 * @component
 * @returns {JSX.Element} Панель нижней навигации
 */
const BottomNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  /**
   * Проверка активного пути
   */
  const isActive = (path: string): boolean => {
    return location.pathname === `/mobile${path}`;
  };

  return (
    <nav className={styles.bottomNav}>
      {/* Home */}
      <button
        className={`${styles.navItem} ${isActive('/home') ? styles.active : ''}`}
        onClick={() => navigate('/mobile/home')}
      >
        <svg viewBox="0 0 24 24" fill="none" className={styles.icon}>
          <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
          <rect x="14" y="3" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
          <rect x="3" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
          <rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="2"/>
        </svg>
      </button>

      {/* Search */}
      <button
        className={`${styles.navItem} ${isActive('/search') ? styles.active : ''}`}
        onClick={() => navigate('/mobile/search')}
      >
        <svg viewBox="0 0 24 24" fill="none" className={styles.icon}>
          <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
          <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>

      {/* Map */}
      <button
        className={`${styles.navItem} ${isActive('/map') ? styles.active : ''}`}
        onClick={() => navigate('/mobile/map')}
      >
        <svg viewBox="0 0 24 24" fill="none" className={styles.icon}>
          <path 
            d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" 
            stroke="currentColor" 
            strokeWidth="2"
            fill="none"
          />
          <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="2"/>
        </svg>
      </button>
    </nav>
  );
};

export default BottomNavigation;
