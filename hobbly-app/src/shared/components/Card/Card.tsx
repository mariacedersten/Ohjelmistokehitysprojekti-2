/**
 * @fileoverview Универсальный компонент карточки
 * @module shared/components/Card
 */

import React from 'react';
import styles from './Card.module.css';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Вариант карточки
   * @default 'default'
   */
  variant?: 'default' | 'elevated' | 'outlined' | 'interactive';
  
  /**
   * Отступы внутри карточки
   * @default 'medium'
   */
  padding?: 'none' | 'small' | 'medium' | 'large';
  
  /**
   * Полная ширина контейнера
   * @default false
   */
  fullWidth?: boolean;
  
  /**
   * Заголовок карточки
   */
  title?: string;
  
  /**
   * Подзаголовок карточки
   */
  subtitle?: string;
  
  /**
   * Изображение карточки
   */
  image?: string;
  
  /**
   * Alt текст для изображения
   */
  imageAlt?: string;
  
  /**
   * Действия в футере карточки
   */
  actions?: React.ReactNode;
  
  /**
   * Дочерние элементы
   */
  children?: React.ReactNode;
}

/**
 * Универсальный компонент карточки
 * @component
 */
const Card: React.FC<CardProps> = ({
  variant = 'default',
  padding = 'medium',
  fullWidth = false,
  title,
  subtitle,
  image,
  imageAlt,
  actions,
  children,
  className = '',
  ...props
}) => {
  const cardClasses = [
    styles.card,
    styles[variant],
    styles[`padding-${padding}`],
    fullWidth && styles.fullWidth,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClasses} {...props}>
      {image && (
        <div className={styles.imageWrapper}>
          <img 
            src={image} 
            alt={imageAlt || title || 'Card image'} 
            className={styles.image}
            loading="lazy"
          />
        </div>
      )}
      
      {(title || subtitle) && (
        <div className={styles.header}>
          {title && <h3 className={styles.title}>{title}</h3>}
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
      )}
      
      {children && (
        <div className={styles.content}>
          {children}
        </div>
      )}
      
      {actions && (
        <div className={styles.actions}>
          {actions}
        </div>
      )}
    </div>
  );
};

export default Card;
