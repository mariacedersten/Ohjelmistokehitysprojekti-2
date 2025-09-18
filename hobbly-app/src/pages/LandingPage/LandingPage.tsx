/**
 * @fileoverview Лендинг страница для выбора между мобильной версией и админ-панелью
 * @module pages/LandingPage
 * @description Главная страница с выбором интерфейса для разных типов пользователей
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../shared/components/Button';
import styles from './LandingPage.module.css';

/**
 * Лендинг страница с выбором между мобильной версией и админ-панелью
 * @component
 * @returns {JSX.Element} Лендинг страница
 */
const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  /**
   * Обработчик навигации к мобильной версии
   */
  const handleMobileClick = () => {
    navigate('/mobile');
  };

  /**
   * Обработчик навигации к админ-панели
   */
  const handleAdminClick = () => {
    navigate('/admin');
  };

  return (
    <div className={styles.container}>
      {/* Фоновые элементы */}
      <div className={styles.backgroundShape1}></div>
      <div className={styles.backgroundShape2}></div>

      {/* Главный контент */}
      <div className={styles.content}>
        {/* Логотип и заголовок */}
        <div className={styles.header}>
          <img
            src="/Logo Hobbly/logo_white@high-res.png"
            alt="Hobbly"
            className={styles.logo}
          />
          <h1 className={styles.title}>Choose Your Experience</h1>
          <p className={styles.subtitle}>
            Select the interface that best suits your needs
          </p>
        </div>

        {/* Карточки выбора */}
        <div className={styles.cards}>
          {/* Мобильная версия */}
          <div className={styles.card} onClick={handleMobileClick}>
            <div className={styles.cardIcon}>📱</div>
            <h2 className={styles.cardTitle}>Mobile App</h2>
            <p className={styles.cardDescription}>
              Find and explore hobby activities in your area
            </p>
            <ul className={styles.cardFeatures}>
              <li>Browse activities</li>
              <li>Search with filters</li>
              <li>View on map</li>
              <li>Activity details</li>
            </ul>
            <Button
              variant="accent"
              fullWidth
              className={styles.cardButton}
            >
              Enter Mobile App →
            </Button>
          </div>

          {/* Админ-панель */}
          <div className={styles.card} onClick={handleAdminClick}>
            <div className={styles.cardIcon}>🖥️</div>
            <h2 className={styles.cardTitle}>Admin Panel</h2>
            <p className={styles.cardDescription}>
              Manage activities, users and analytics
            </p>
            <ul className={styles.cardFeatures}>
              <li>Manage activities</li>
              <li>User management</li>
              <li>Analytics dashboard</li>
              <li>Organization profile</li>
            </ul>
            <Button
              variant="primary"
              fullWidth
              className={styles.cardButton}
            >
              Enter Admin Panel →
            </Button>
          </div>
        </div>

        {/* Футер */}
        <div className={styles.footer}>
          <p className={styles.footerText}>
            Hobbly Technologies Oy - Making hobbies accessible for everyone
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;