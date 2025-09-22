/**
 * @fileoverview Компонент загрузчика
 * @module shared/components/Loader
 */

import React from 'react';
import styles from './Loader.module.css';

export interface LoaderProps {
  /**
   * Размер загрузчика
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large';
  
  /**
   * Цвет загрузчика
   * @default 'primary'
   */
  color?: 'primary' | 'accent' | 'white';
  
  /**
   * Полноэкранный режим
   * @default false
   */
  fullScreen?: boolean;
  
  /**
   * Текст загрузки
   */
  text?: string;
}

/**
 * Компонент загрузчика с анимацией в стиле Hobbly
 * @component
 */
const Loader: React.FC<LoaderProps> = ({
  size = 'medium',
  color = 'primary',
  fullScreen = false,
  text
}) => {
  const loaderContent = (
    <div className={[styles.loader, styles[size], styles[color]].join(' ')}>
      <div className={styles.spinner}>
        <div className={styles.dot1}></div>
        <div className={styles.dot2}></div>
        <div className={styles.dot3}></div>
      </div>
      {text && <p className={styles.text}>{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className={styles.fullScreenOverlay}>
        {loaderContent}
      </div>
    );
  }

  return loaderContent;
};

export default Loader;
