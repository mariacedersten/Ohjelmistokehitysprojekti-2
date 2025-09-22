/**
 * @fileoverview Универсальный компонент поля ввода
 * @module shared/components/Input
 */

import React, { forwardRef } from 'react';
import styles from './Input.module.css';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'onChange'> {
  /**
   * Метка поля
   */
  label?: string;
  
  /**
   * Текст ошибки
   */
  error?: string;
  
  /**
   * Подсказка под полем
   */
  hint?: string;
  
  /**
   * Размер поля
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large';
  
  /**
   * Полная ширина контейнера
   * @default false
   */
  fullWidth?: boolean;
  
  /**
   * Иконка слева
   */
  leftIcon?: React.ReactNode;
  
  /**
   * Иконка справа
   */
  rightIcon?: React.ReactNode;
  
  /**
   * Обязательное поле
   * @default false
   */
  required?: boolean;
  
  /**
   * Функция обработки изменения значения
   */
  onChange?: (value: string) => void;
}

/**
 * Универсальный компонент поля ввода
 * @component
 */
const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  hint,
  size = 'medium',
  fullWidth = false,
  leftIcon,
  rightIcon,
  required = false,
  className = '',
  id,
  onChange,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  const containerClasses = [
    styles.container,
    fullWidth && styles.fullWidth,
  ].filter(Boolean).join(' ');
  
  const inputWrapperClasses = [
    styles.inputWrapper,
    styles[size],
    error && styles.error,
    leftIcon && styles.hasLeftIcon,
    rightIcon && styles.hasRightIcon,
  ].filter(Boolean).join(' ');
  
  const inputClasses = [
    styles.input,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      
      <div className={inputWrapperClasses}>
        {leftIcon && (
          <span className={styles.leftIcon}>{leftIcon}</span>
        )}
        
        <input
          ref={ref}
          id={inputId}
          className={inputClasses}
          aria-invalid={!!error}
          aria-describedby={
            error ? `${inputId}-error` : 
            hint ? `${inputId}-hint` : 
            undefined
          }
          required={required}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          {...props}
        />
        
        {rightIcon && (
          <span className={styles.rightIcon}>{rightIcon}</span>
        )}
      </div>
      
      {error && (
        <span id={`${inputId}-error`} className={styles.error} role="alert">
          {error}
        </span>
      )}
      
      {hint && !error && (
        <span id={`${inputId}-hint`} className={styles.hint}>
          {hint}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
