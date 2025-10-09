/**
 * @fileoverview Search страница мобильного приложения
 * @module mobile/pages/Search
 * @description Страница поиска активностей с расширенной фильтрацией
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Search.module.css';
import MobileHeader from '../../components/MobileHeader';
import {
  Activity,
  Category,
  Tag,
  ActivityType,
  ActivityFilters
} from '../../../types';
import activitiesAPI from '../../../api/activities.api';
import { debounce } from 'lodash';

const cardBorderColors = ['#FFD93D', '#6BCF7C', '#1DB9C3'];

const Search: React.FC = () => {
  const navigate = useNavigate();

  // Данные для фильтров
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);

  // Выбранные фильтры
  const [filters, setFilters] = useState<ActivityFilters>({});
  const [searchQuery, setSearchQuery] = useState('');

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Загружаем категории и теги при монтировании
  useEffect(() => {
    (async () => {
      try {
        const [cats, tgs] = await Promise.all([
          activitiesAPI.getCategories(),
          activitiesAPI.getTags()
        ]);
        setCategories(cats);
        setTags(tgs);
      } catch (err) {
        console.error('Failed to load categories or tags', err);
      }
    })();
  }, []);

  // Общий дебаунс поиска
  const debouncedSearch = useCallback(
  debounce(async (filters: ActivityFilters) => {
    try {
      setLoading(true);
      setError(null);
      setHasSearched(true);

      const queryFilters = { ...filters }; // копия фильтров
      let sortField: string = 'created_at';
      let sortOrder: boolean = false; // false = по убыванию

      switch (filters.sortOption) {
        case 'asc':
          sortField = 'price';
          sortOrder = true;
          break;
        case 'desc':
          sortField = 'price';
          sortOrder = false;
          break;
        case 'free':
          // предполагаем, что API понимает price=0 как фильтр
          queryFilters.minPrice = 0;
          queryFilters.maxPrice = 0;
          break;
        default:
          sortField = 'created_at';
          sortOrder = false;
      }

      const response = await activitiesAPI.getActivities(
        queryFilters,
        1,
        50,
        sortField,
        sortOrder
      );

      setActivities(response.data);
    } catch (err) {
      console.error('Search error:', err);
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }, 500),
  []
);


  // Обновление фильтров и запуск поиска
  const updateFilters = (patch: Partial<ActivityFilters>) => {
    const next = { ...filters, ...patch };
    setFilters(next);
    debouncedSearch(next);
  };

  // Обработчик текстового поиска
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    updateFilters({ search: query });
  };

  const handleActivityClick = (id: string) => navigate(`/mobile/activity/${id}`);

  const formatDate = (date?: Date | string) => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('fi-FI', { day: '2-digit', month: '2-digit' });
  };

  return (
    <div className={styles.search}>
      <MobileHeader />

      {/* Панель поиска */}
      <div className={styles.searchBarContainer}>
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Search activities..."
            value={searchQuery}
            onChange={handleSearchChange}
            className={styles.searchInput}
            autoFocus
          />
        </div>

        {/* Фильтры */}
        <div className={styles.filtersColumn}>
          {/* Категория */}
          <select
            className={styles.filterInput}
            value={filters.categoryId || ''}
            onChange={e =>
              updateFilters({ categoryId: e.target.value || undefined })
            }
            lang="en"
            translate="no"
          >
            <option value="">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Тип события */}
          <select
            className={styles.filterInput}
            value={filters.type || ''}
            onChange={e =>
              updateFilters({
                type: (e.target.value as ActivityType) || undefined
              })
            }
            lang="en"
            translate="no"
          >
            <option value="">All Types</option>
            {Object.values(ActivityType).map(t => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

         {/* Теги (включают возрастные группы и другие) */}
          <select
            className={styles.filterInput}
            value={filters.tags && filters.tags.length > 0 ? filters.tags[0] : 'all'}
            onChange={e => {
              const val = e.target.value;
              updateFilters({ tags: val === 'all' ? [] : [val] });
            }}
            lang="en"
            translate="no"
          >
            <option value="all">All Tags</option>
            {tags.map(t => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          {/* Сортировка / Цена */}
            <select
              className={styles.filterInput}
              value={filters.sortOption || 'all'}
              onChange={e =>
                updateFilters({
                  sortOption: e.target.value as 'all' | 'free' | 'asc' | 'desc',
                  freeOnly: e.target.value === 'free' ? true : false, // сбрасываем freeOnly для остальных
                })
              }
              lang="en"
              translate="no"
            >
              <option value="all">Price</option>
              <option value="free">Free Only</option>
              <option value="asc">Cheapest First</option>
              <option value="desc">Most Expensive First</option>
            </select>



          {hasSearched && !loading && (
            <div className={styles.resultsCount}>
              Result: {activities.length} activities
            </div>
          )}
        </div>
      </div>

      {/* Список результатов */}
      <div className={styles.content}>
        {loading ? (
          <p>Searching...</p>
        ) : error ? (
          <p className={styles.error}>{error}</p>
        ) : !hasSearched ? (
          <p>Start typing or set filters to search for activities</p>
        ) : activities.length === 0 ? (
          <p>No results</p>
        ) : (
          <div className={styles.activitiesList}>
            {activities.map((activity, idx) => (
              <div
                key={activity.id}
                className={styles.activityCard}
                style={{
                  borderColor:
                    cardBorderColors[idx % cardBorderColors.length]
                }}
                onClick={() => handleActivityClick(activity.id)}
              >
                <div className={styles.imageContainer}>
                  <img
                    src={
                      activity.imageUrl ||
                      '/assets/wireframes/Photos/Events/1.1 Sea Expedition.jpg'
                    }
                    alt={activity.title}
                  />
                </div>
                <div className={styles.activityInfo}>
                  <h3>{activity.title}</h3>
                  <p>{activity.shortDescription}</p>
                  <div>
                    <span>{activity.location}</span> |{' '}
                    <span>{formatDate(activity.startDate)}</span>
                  </div>
                  <div>
                    {activity.category?.name} |{' '}
                    {activity.price === 0
                      ? 'Free'
                      : `${activity.price} €`}
                  </div>
                  <div>
                    {activity.tags?.map(t => (
                      <span key={t.id} className={styles.tag}>
                        {t.name}
                      </span>
                    ))}
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



