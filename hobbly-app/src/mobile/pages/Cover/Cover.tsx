/**
 * @fileoverview Стартовая страница мобильного приложения
 * @module mobile/pages/Cover
 * @description Страница приветствия с опциями входа: гость, логин, регистрация
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Cover.module.css';

/**
 * Стартовая страница приложения
 * @component
 * @returns {JSX.Element} Страница с логотипом и кнопками входа
 */
const Cover: React.FC = () => {
  const navigate = useNavigate();

  /**
   * Обработчик входа в режиме гостя
   */
  const handleGuestMode = () => {
    navigate('/mobile/home');
  };

  /**
   * Обработчик перехода к странице входа
   */
  const handleLogin = () => {
    navigate('/mobile/login');
  };

  /**
   * Обработчик перехода к странице регистрации
   */
  const handleSignUp = () => {
    navigate('/mobile/signup'); 
  };


  return (
    <div className={styles.cover}>
      <div className={styles.container}>
        {/* Логотип Hobbly */}
        <div className={styles.logoContainer}>
          <img 
            src="https://jourvbtxuyavamxvddwc.supabase.co/storage/v1/object/public/activities/Logo%20Hobbly/logo_white@low-res.png" 
            alt="Hobbly" 
            className={styles.logo}
          />

        </div>

        {/* Кнопки действий */}
        <div className={styles.buttonsContainer}>
          <button 
            className={`${styles.button} ${styles.guestButton}`}
            onClick={handleGuestMode}
          >
            Guest
          </button>
          
          <button 
            className={`${styles.button} ${styles.loginButton}`}
            onClick={handleLogin}
          >
            Log in
          </button>
          
          <button 
            className={`${styles.button} ${styles.signUpButton}`}
            onClick={handleSignUp}
          >
            Sign up
          </button>
        </div>
      </div>
    </div>
  );
};

export default Cover;
