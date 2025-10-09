/**
 * @fileoverview ActivityDetail страница мобильного приложения
 * @module mobile/pages/ActivityDetail
 * @description Детальная страница активности согласно дизайну Announcement
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './ActivityDetail.module.css';
import MobileHeader from '../../components/MobileHeader';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Activity } from '../../../types';
import activitiesAPI from '../../../api/activities.api';

/**
 * ActivityDetail компонент - детальная страница активности
 * @component
 * @returns {JSX.Element} Детальная страница активности
 */
const ActivityDetail: React.FC = () => {
  type NamedObject = { name: string };
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadActivity(id);
    }
  }, [id]);

  /**
   * Загрузка данных активности
   */
  const loadActivity = async (activityId: string) => {
    try {
      setLoading(true);
      const data = await activitiesAPI.getActivityById(activityId);
      setActivity(data);
    } catch (err) {
      console.error('Error loading activity:', err);
      setError('Failed to load activity details');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Обработчик кнопки назад
   */
  const handleBack = () => {
    navigate(-1);
  };

  /**
   * Форматирование даты
   */
  const formatDate = (date: Date | string | undefined): string => {
    if (!date) return 'Date TBD';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
  };

  /**
   * Форматирование цены
   */
  const formatPrice = (price?: number, currency?: string): string => {
    if (!price || price === 0) return 'Free';
    return `${price} ${currency || 'EUR'}`;
  };

  /**
   * Открытие карты
   */
  const handleCheckOnMap = () => {
    if (activity?.coordinates) {
      // Открыть в Google Maps или встроенной карте
      const url = `https://maps.google.com/?q=${activity.coordinates.lat},${activity.coordinates.lng}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className={styles.activityDetail}>
      {/* Header с кнопкой назад */}
      <MobileHeader showBack onBack={handleBack} />

      {/* Content */}
      <div className={styles.content}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Loading activity details...</p>
          </div>
        ) : error ? (
          <div className={styles.errorContainer}>
            <p>{error}</p>
            <button onClick={() => id && loadActivity(id)} className={styles.retryButton}>
              Retry
            </button>
          </div>
        ) : activity ? (
          <div className={styles.activityCard}>
            {/* Заголовок и дата */}
            <div className={styles.titleSection}>
              <h1 className={styles.title}>NAME: {activity.title}</h1>
              <p className={styles.date}>{formatDate(activity.startDate)}</p>
            </div>

            {/* Изображение */}
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

           {/* Теги */}
            {activity.tags && activity.tags.length > 0 && (
              <div className={styles.tagsSection}>
                <span className={styles.tagsLabel}>Tags:</span>
                <span className={styles.tags}>
                  {activity.tags.map((tag, index) => (
                    <span key={tag.id || index}>
                      {typeof tag === 'string' ? tag : tag.name}
                      {index < activity.tags!.length - 1 && ', '}
                    </span>
                  ))}
                </span>
              </div>
            )}

          {/* Тип события и категория */}
            <div className={styles.typeCategoryContent}>
              {activity.type && (
                <span className={styles.typeItem}>
                  <span className={styles.typeLabel}>Type:</span>{' '}
                  {typeof activity.type === 'string' ? activity.type : (activity.type as NamedObject).name}
                </span>
              )}
              {activity.category && (
                <span className={styles.categoryItem}>
                  <span className={styles.typeLabel}>Category:</span>{' '}
                  {typeof activity.category === 'string' ? activity.category : (activity.category as NamedObject).name}
                </span>
              )}
            </div>

            {/* Описание */}
            <div className={styles.descriptionSection}>
              <h2 className={styles.sectionTitle}>Description:</h2>
              <p className={styles.description}>
                {activity.description || 'No description available.'}
              </p>
            </div>

            {/* Локация */}
            <div className={styles.locationSection}>
              <div className={styles.locationInfo}>
                <h2 className={styles.sectionTitle}>Location:</h2>
                <div className={styles.locationDetails}>
                  <svg className={styles.locationIcon} width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" 
                          stroke="currentColor" strokeWidth="2" fill="none"/>
                    <circle cx="12" cy="9" r="2.5" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  <span>{activity.location}</span>
                  {activity.address && (
                    <span className={styles.address}>, {activity.address}</span>
                  )}
                </div>
                {activity.coordinates && (
                  <button onClick={handleCheckOnMap} className={styles.checkMapButton}>
                    Check on map ›
                  </button>
                )}
              </div>
              {/* Embedded map for the single activity */}
              {activity.coordinates && (
                <div className={styles.mapContainer}>
                  <MapContainer
                    center={[activity.coordinates.lat, activity.coordinates.lng]}
                    zoom={13}
                    style={{ width: '100%', height: '100%' }}
                    scrollWheelZoom={false}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[activity.coordinates.lat, activity.coordinates.lng]} />
                  </MapContainer>
                </div>
              )}
            </div>

            {/* Организатор */}
            <div className={styles.organizerSection}>
              <h2 className={styles.sectionTitle}>Organiser:</h2>
              <span className={styles.organizerName}>
                {activity.organizer?.organizationName || 'Unknown Organizer'}
              </span>
            </div>

            {/* Контактное лицо */}
            {(activity.organizer || activity.contactEmail || activity.contactPhone) && (
              <div className={styles.contactSection}>
                <h2 className={styles.sectionTitle}>Contact Person:</h2>
                <div className={styles.contactCard}>
                  <img 
                    src={activity.organizer?.photoUrl || '/assets/wireframes/Photos/Organizations/1 Jack Sparrow.jpg'}
                    alt={activity.organizer?.fullName || 'Contact'}
                    className={styles.contactPhoto}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/assets/wireframes/Photos/Organizations/1 Jack Sparrow.jpg';
                    }}
                  />
                  <div className={styles.contactInfo}>
                    <p className={styles.contactName}>
                      {activity.organizer?.fullName || 'Contact Person'}
                    </p>
                    {activity.contactPhone && (
                      <p className={styles.contactPhone}>
                        <a href={`tel:${activity.contactPhone}`}>{activity.contactPhone}</a>
                      </p>
                    )}
                    {activity.contactEmail && (
                      <p className={styles.contactEmail}>
                        <a href={`mailto:${activity.contactEmail}`}>{activity.contactEmail}</a>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Дополнительная информация */}
            <div className={styles.additionalInfo}>
              {/* Цена */}
              {activity.price !== undefined && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Price:</span>
                  <span className={styles.infoValue}>{formatPrice(activity.price, activity.currency)}</span>
                </div>
              )}
              
              {/* Максимальное количество участников */}
              {activity.maxParticipants && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Max participants:</span>
                  <span className={styles.infoValue}>{activity.maxParticipants}</span>
                </div>
              )}
              
              {/* Возрастные ограничения */}
              {(activity.minAge || activity.maxAge) && (
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Age:</span>
                  <span className={styles.infoValue}>
                    {activity.minAge || 0} - {activity.maxAge || 99} years
                  </span>
                </div>
              )}
              
              {/* Внешняя ссылка */}
              {activity.externalLink && (
                <div className={styles.infoItem}>
                  <a 
                    href={activity.externalLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={styles.externalLink}
                  >
                    Visit website ›
                  </a>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default ActivityDetail;
