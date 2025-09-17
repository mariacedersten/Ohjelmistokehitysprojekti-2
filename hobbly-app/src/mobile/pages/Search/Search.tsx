/**
 * @fileoverview Search страница мобильного приложения
 * @module mobile/pages/Search
 * @description Страница поиска активностей с фильтрацией
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Search.module.css';
import { Activity } from '../../../types';
import activitiesAPI from '../../../api/activities.api';
import { debounce } from 'lodash';

/**
 * Цвета рамок для карточек (циклично повторяются)
 */
const cardBorderColors = ['#FFD93D', '#6BCF7C', '#1DB9C3'];

/**
 * Search компонент для поиска активностей
 * @component
 * @returns {JSX.Element} Страница поиска
 */
const Search: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  /**
   * Дебаунсированный поиск активностей
   */
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setActivities([]);
        setHasSearched(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        setHasSearched(true);
        
        const response = await activitiesAPI.getActivities(
          { search: query },
          1,
          50, // Загружаем до 50 результатов
          'created_at',
          false
        );

        setActivities(response.data);
      } catch (err) {
        console.error('Ошибка поиска:', err);
        setError('Search failed. Please try again.');
      } finally {
        setLoading(false);
      }
    }, 500),
    []
  );

  /**
   * Обработчик изменения поискового запроса
   */
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    debouncedSearch(query);
  };

  /**
   * Обработчик клика на карточку активности
   */
  const handleActivityClick = (id: string) => {
    navigate(`/mobile/activity/${id}`);
  };

  /**
   * Форматирование даты
   */
  const formatDate = (date: Date | string | undefined): string => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('fi-FI', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div className={styles.search}>
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

      {/* Search Bar */}
      <div className={styles.searchBarContainer}>
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Lorem ipsum"
            value={searchQuery}
            onChange={handleSearchChange}
            className={styles.searchInput}
            autoFocus
          />
          <button className={styles.searchButton}>
            <svg viewBox="0 0 24 24" fill="none" className={styles.searchIcon}>
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
              <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        
        {/* Results Count */}
        {hasSearched && !loading && (
          <div className={styles.resultsCount}>
            Result: {activities.length} results "{searchQuery}"
          </div>
        )}
      </div>

      {/* Content */}
      <div className={styles.content}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Searching...</p>
          </div>
        ) : error ? (
          <div className={styles.errorContainer}>
            <p>{error}</p>
          </div>
        ) : !hasSearched ? (
          <div className={styles.emptyContainer}>
            <p>Start typing to search for activities</p>
          </div>
        ) : activities.length === 0 ? (
          <div className={styles.emptyContainer}>
            <p>No results found for "{searchQuery}"</p>
          </div>
        ) : (
          <div className={styles.activitiesList}>
            {activities.map((activity, index) => (
              <div
                key={activity.id}
                className={styles.activityCard}
                style={{ borderColor: cardBorderColors[index % cardBorderColors.length] }}
                onClick={() => handleActivityClick(activity.id)}
              >
                {/* Изображение активности */}
                <div className={styles.imageContainer}>
                  <img
                    src={activity.imageUrl || '/assets/wireframes/Photos/Events/1.1 Sea Expedition.jpg'}
                    alt={activity.title}
                    className={styles.activityImage}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/assets/wireframes/Photos/Events/1.1 Sea Expedition.jpg';
                    }}
                  />
                </div>

                {/* Информация об активности */}
                <div className={styles.activityInfo}>
                  <h3 className={styles.activityTitle}>{activity.title}</h3>
                  <p className={styles.activityDescription}>
                    <span className={styles.label}>Description:</span> {activity.shortDescription || activity.description?.substring(0, 100) + '...'}
                  </p>
                  
                  <div className={styles.activityMeta}>
                    <div className={styles.metaItem}>
                      <img src="/assets/wireframes/Icons/location.svg" alt="Location" className={styles.icon} />
                      <span>{activity.location}</span>
                    </div>
                    
                    <div className={styles.metaItem}>
                      <svg className={styles.icon} viewBox="0 0 24 24" fill="none">
                        <rect x="3" y="6" width="18" height="14" stroke="currentColor" strokeWidth="2"/>
                        <path d="M3 10H21" stroke="currentColor" strokeWidth="2"/>
                        <path d="M8 6V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M16 6V3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                      <span>{formatDate(activity.startDate)}</span>
                    </div>
                    
                    <div className={styles.metaItem}>
                      <span className={styles.organizer}>{activity.organizer?.organizationName || 'Organizer'}</span>
                      <span className={styles.arrow}>›</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
