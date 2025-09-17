/**
 * @fileoverview Map страница мобильного приложения
 * @module mobile/pages/Map
 * @description Страница с картой активностей
 */

import React from 'react';
import styles from './Map.module.css';

/**
 * Map компонент
 * @component
 * @returns {JSX.Element} Страница карты
 */
const Map: React.FC = () => {
  return (
    <div className={styles.map}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logoContainer}>
          <img 
            src="/assets/wireframes/Logo Hobbly/logo_white@low-res.png" 
            alt="Hobbly" 
            className={styles.logo}
          />
        </div>
      </header>

      {/* Map Container */}
      <div className={styles.mapContainer}>
        <p className={styles.placeholder}>Map functionality coming soon...</p>
      </div>
    </div>
  );
};

export default Map;
