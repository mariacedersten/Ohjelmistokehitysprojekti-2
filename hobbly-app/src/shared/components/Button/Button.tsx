/**
 * @fileoverview Универсальный компонент кнопки
 * @module shared/components/Button
 */

import React from 'react';
import styles from './Button.module.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Вариант кнопки
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'danger';
  
  /**
   * Размер кнопки
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large';
  
  /**
   * Полная ширина контейнера
   * @default false
   */
  fullWidth?: boolean;
  
  /**
   * Состояние загрузки
   * @default false
   */
  loading?: boolean;
  
  /**
   * Иконка слева
   */
  leftIcon?: React.ReactNode;
  
  /**
   * Иконка справа
   */
  rightIcon?: React.ReactNode;
  
  /**
   * Дочерние элементы
   */
  children: React.ReactNode;
}

/**
 * Универсальный компонент кнопки с поддержкой различных вариантов и размеров
 * @component
 */
const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  loading = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const buttonClasses = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    loading && styles.loading,
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      className={buttonClasses}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className={styles.loader}>
          <span className={styles.loaderDot}></span>
          <span className={styles.loaderDot}></span>
          <span className={styles.loaderDot}></span>
        </span>
      ) : (
        <>
          {leftIcon && <span className={styles.leftIcon}>{leftIcon}</span>}
          <span className={styles.content}>{children}</span>
          {rightIcon && <span className={styles.rightIcon}>{rightIcon}</span>}
        </>
      )}
    </button>
  );
};

export default Button;
