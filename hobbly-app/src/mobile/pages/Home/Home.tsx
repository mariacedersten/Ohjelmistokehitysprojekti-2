/**
 * @fileoverview Homepage мобильного приложения
 * @module mobile/pages/Home
 * @description Главная страница со списком активностей
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Home.module.css';
import { Activity, ActivityFilters } from '../../../types';
import activitiesAPI from '../../../api/activities.api';

/**
 * Цвета рамок для карточек (циклично повторяются)
 */
const cardBorderColors = ['#FFD93D', '#6BCF7C', '#1DB9C3'];

/**
 * Homepage компонент с листингом активностей
 * @component
 * @returns {JSX.Element} Страница с карточками активностей
 */
const Home: React.FC = () => {
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  /**
   * Загрузка активностей при монтировании компонента
   */
  useEffect(() => {
    loadActivities();
  }, []);

  /**
   * Загрузка активностей через API
   */
  const loadActivities = async (loadMore = false) => {
    try {
      setLoading(true);
      setError(null);
      
      const currentPage = loadMore ? page + 1 : 1;
      const response = await activitiesAPI.getActivities(
        {}, // Без фильтров для гостевого режима
        currentPage,
        20, // Загружаем по 20 активностей
        'created_at',
        false // Сортировка по убыванию (новые первые)
      );

      if (loadMore) {
        setActivities(prev => [...prev, ...response.data]);
        setPage(currentPage);
      } else {
        setActivities(response.data);
        setPage(1);
      }

      // Проверяем, есть ли еще страницы
      const totalPages = Math.ceil(response.total / response.pagination.limit);
      setHasMore(currentPage < totalPages);

    } catch (err) {
      console.error('Ошибка загрузки активностей:', err);
      setError('Failed to load activities. Please try again later.');
    } finally {
      setLoading(false);
    }
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

  /**
   * Обработчик прокрутки для загрузки дополнительных активностей
   */
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    
    // Загружаем больше, когда доскроллили почти до конца
    if (scrollHeight - scrollTop <= clientHeight * 1.5) {
      if (hasMore && !loading) {
        loadActivities(true);
      }
    }
  };

  return (
    <div className={styles.home}>
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

      {/* Content */}
      <div className={styles.content} onScroll={handleScroll}>
        {loading && activities.length === 0 ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Loading activities...</p>
          </div>
        ) : error ? (
          <div className={styles.errorContainer}>
            <p>{error}</p>
            <button onClick={() => loadActivities()} className={styles.retryButton}>
              Retry
            </button>
          </div>
        ) : activities.length === 0 ? (
          <div className={styles.emptyContainer}>
            <p>No activities found</p>
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

            {/* Загрузчик для дополнительных страниц */}
            {loading && activities.length > 0 && (
              <div className={styles.loadMoreContainer}>
                <div className={styles.spinner}></div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
