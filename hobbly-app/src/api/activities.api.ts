/**
 * @fileoverview API сервис для работы с активностями
 * @module api/activities
 * @description Обеспечивает CRUD операции для активностей через Supabase REST API
 */

import {
  apiClient,
  storageClient,
  buildFilterQuery,
  buildPaginationConfig,
  buildOrderQuery,
  API_CONSTANTS
} from './config';
import {
  Activity,
  ActivityFormData,
  ActivityFilters,
  ApiListResponse,
  Category,
  Tag,
  User,
  UserRole
} from '../types';
import { AxiosResponse } from 'axios';

/**
 * Класс для работы с активностями
 * @class
 * @description Предоставляет методы для создания, чтения, обновления и удаления активностей
 */
class ActivitiesAPI {
  private readonly endpoint = '/activities';
  private readonly fullViewEndpoint = '/activities_full';

  /**
   * Получение списка активностей с фильтрацией и пагинацией, используя view `activities_full`
   * ⚠️ ВАЖНО: Возвращает только подтвержденные (isApproved=true) активности
   * @param {ActivityFilters} filters - Фильтры для поиска
   * @param {number} page - Номер страницы (начиная с 1)
   * @param {number} limit - Количество элементов на странице
   * @param {string} orderBy - Поле для сортировки
   * @param {boolean} ascending - Направление сортировки
   * @param {string} currentUserId - ID текущего пользователя (для ORGANIZER - показывать только свои)
   * @param {UserRole} currentUserRole - Роль текущего пользователя
   * @returns {Promise<ApiListResponse<Activity>>} Список подтвержденных активностей с метаданными
   *
   * @example
   * // Получить только подтвержденные активности
   * const activities = await activitiesAPI.getActivities(
   *   { categoryId: '123', freeOnly: true },
   *   1,
   *   20,
   *   'created_at',
   *   false,
   *   'user-123',
   *   UserRole.ORGANIZER
   * );
   */
  async getActivities(
    filters: ActivityFilters = {},
    page: number = 1,
    limit: number = API_CONSTANTS.DEFAULT_PAGE_SIZE,
    orderBy: string = 'created_at',
    ascending: boolean = false,
    currentUserId?: string,
    currentUserRole?: UserRole
  ): Promise<ApiListResponse<Activity>> {
    try {
      // Подготавливаем параметры запроса
      const queryParams: Record<string, any> = {
        is_deleted: 'is.false', // Используем 'is.false' для точного соответствия
        isApproved: 'eq.true', // Показываем только подтвержденные активности
      };

      // Дополнительные параметры, которые нельзя выразить одним ключом (повторяющиеся price, id=in.(...))
      const extraParams: string[] = [];

      // Ограничиваем доступ для ORGANIZER - только свои активности
      if (currentUserRole === UserRole.ORGANIZER && currentUserId) {
        queryParams.user_id = `eq.${currentUserId}`;
      }

      // Добавляем фильтры
      if (filters.search) {
        queryParams.or = `(title.ilike.*${filters.search}*,description.ilike.*${filters.search}*,location.ilike.*${filters.search}*,organizer_name.ilike.*${filters.search}*)`;
      }

      if (filters.categoryId) {
        queryParams.category_id = `eq.${filters.categoryId}`;
      }

      if (filters.type) {
        queryParams.type = `eq.${filters.type}`;
      }

      if (filters.location) {
        queryParams.location = `ilike.*${filters.location}*`;
      }

      // Фильтрация по цене (каждый оператор отдельным параметром)
      if (filters.freeOnly) {
        extraParams.push('price=eq.0');
      } else {
        if (filters.minPrice !== undefined) extraParams.push(`price=gte.${filters.minPrice}`);
        if (filters.maxPrice !== undefined) extraParams.push(`price=lte.${filters.maxPrice}`);
      }

      // Фильтрация по тегам (tag_id из таблицы activity_tags)
      if (filters.tags && filters.tags.length > 0) {
        try {
          const tagIds = filters.tags.join(',');
          const tagFilterUrl = `/activity_tags?tag_id=in.(${tagIds})&select=activity_id`;
          const tagResp: AxiosResponse<{ activity_id: string }[]> = await apiClient.get(tagFilterUrl);
          const activityIds = Array.from(new Set((tagResp.data || []).map(r => r.activity_id))).filter(Boolean);
          if (activityIds.length === 0) {
            return {
              data: [],
              pagination: { page, limit, total: 0 },
              total: 0
            };
          }
          const inList = activityIds.join(',');
          extraParams.push(`id=in.(${inList})`);
        } catch (tagErr) {
          console.warn('Failed to filter by tags, proceeding without tag filter:', tagErr);
        }
      }

      // Строим URL с параметрами
      const filterQuery = buildFilterQuery(queryParams);
      const orderQuery = buildOrderQuery(orderBy, ascending);
      const paginationConfig = buildPaginationConfig(page, limit);

      // Выполняем запрос к view `activities_full`
      // Use view `activities_full` which already exposes related fields
      const extra = extraParams.length ? `&${extraParams.join('&')}` : '';
      const response: AxiosResponse<any[]> = await apiClient.get(
        `${this.fullViewEndpoint}?${filterQuery}${extra}&order=${orderQuery}&select=*`,
        paginationConfig
      );

      // Получаем общее количество из заголовка
      const contentRange = response.headers['content-range'];
      const total = contentRange ? parseInt(contentRange.split('/')[1]) : 0;

      // Преобразуем данные
      const activities = response.data.map(this.transformActivity);

      return {
        data: activities,
        pagination: {
          page,
          limit,
          total
        },
        total
      };
    } catch (error) {
      console.error('Ошибка получения активностей:', error);
      throw error;
    }
  }

  /**
   * Получение одной активности по ID
   * @param {string} id - ID активности
   * @returns {Promise<Activity>} Активность с полной информацией
   * @throws {ApiError} Если активность не найдена
   *
   * @example
   * const activity = await activitiesAPI.getActivityById('123-456-789');
   */
  async getActivityById(id: string): Promise<Activity> {
    try {
      const response: AxiosResponse<any[]> = await apiClient.get(
        `${this.fullViewEndpoint}?id=eq.${id}&select=*`
      );

      if (!response.data || response.data.length === 0) {
        throw new Error('Activity not found');
      }

      const activityData = response.data[0];
      
      // Получаем дополнительную информацию об организаторе, включая фото
      if (activityData.user_id) {
        try {
          const organizerResponse: AxiosResponse<any[]> = await apiClient.get(
            `/user_profiles?id=eq.${activityData.user_id}&select=avatar_url`
          );
          console.log('!!!organizerResponse',  organizerResponse.data[0]);
          if (organizerResponse.data && organizerResponse.data.length > 0) {
            activityData.organizer_photo_url = organizerResponse.data[0].avatar_url;
          }
        } catch (organizerError) {
          console.warn('Failed to fetch organizer photo:', organizerError);
          // Продолжаем без фото организатора
        }
      }

      return this.transformActivity(activityData);
    } catch (error) {
      console.error('Error fetching activity by ID:', error);
      throw error;
    }
  }

  /**
   * Создание новой активности
   * @param {ActivityFormData} data - Данные для создания активности
   * @param {string} currentUserId - ID текущего пользователя
   * @returns {Promise<Activity>} Созданная активность
   * @throws {ApiError} Ошибка создания
   *
   * @example
   * const newActivity = await activitiesAPI.createActivity({
   *   title: 'Футбольная секция',
   *   description: 'Для детей 7-12 лет',
   *   type: ActivityType.CLUB,
   *   categoryId: '123',
   *   location: 'Хельсинки',
   *   tags: ['tag1', 'tag2']
   * }, 'user-123');
   */
  async createActivity(data: ActivityFormData, currentUserId: string): Promise<Activity> {
    try {
      console.log('🚀 Creating new activity...');
      console.log('📋 Input activity data:', {
        title: data.title,
        type: data.type,
        categoryId: data.categoryId,
        location: data.location,
        price: data.price,
        startDate: data.startDate,
        endDate: data.endDate,
        tagsCount: data.tags?.length || 0,
        hasDescription: !!data.description,
        hasImage: !!data.image || !!data.imageUrl
      });

      // Validate required fields
      const requiredFields = ['title', 'description', 'type', 'categoryId', 'location'];
      const missingFields = requiredFields.filter(field => !data[field as keyof ActivityFormData]);
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // Загружаем изображение, если есть файл
      let imageUrl = data.imageUrl || null;
      if (data.image) {
        console.log('📸 Uploading image...');
        imageUrl = await this.uploadImage(data.image);
        console.log('✅ Image uploaded:', imageUrl);
      }

      // Подготавливаем данные для создания с proper null handling
      const activityData = {
        title: data.title.trim(),
        description: data.description.trim(),
        short_description: data.shortDescription?.trim() || (data.description.length > 100 ? data.description.substring(0, 97) + '...' : data.description.trim()),
        type: data.type,
        category_id: data.categoryId,
        location: data.location.trim(),
        address: data.address?.trim() || null,
        price: data.price || null,
        currency: data.currency || 'EUR',
        image_url: imageUrl,
        start_date: data.startDate ? new Date(data.startDate).toISOString() : null,
        end_date: data.endDate ? new Date(data.endDate).toISOString() : null,
        max_participants: data.maxParticipants || null,
        min_age: data.minAge || null,
        max_age: data.maxAge || null,
        contact_email: data.contactEmail?.trim() || null,
        contact_phone: data.contactPhone?.trim() || null,
        external_link: data.externalLink?.trim() || null,
        user_id: currentUserId,
        is_deleted: false
      };

      console.log('💾 Activity data prepared for database:', {
        ...activityData,
        description: `${activityData.description.substring(0, 50)}...`,
        start_date: activityData.start_date,
        end_date: activityData.end_date,
        category_id: activityData.category_id,
        type: activityData.type
      });

      // Создаем активность
      console.log('⬆️ Sending POST request to /activities...');
      const response: AxiosResponse<Activity[]> = await apiClient.post(
        '/activities',
        activityData
      );

      console.log('✅ Create response received:', {
        status: response.status,
        statusText: response.statusText,
        hasData: !!response.data,
        dataLength: Array.isArray(response.data) ? response.data.length : 0
      });

      if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
        console.error('❌ Invalid response structure:', response.data);
        throw new Error('No data returned from activity creation');
      }

      const activity = response.data[0];
      console.log('📊 Created activity ID:', activity.id);

      // Добавляем теги
      if (data.tags && data.tags.length > 0) {
        console.log('🏷️ Adding tags:', data.tags);
        try {
          await this.addTagsToActivity(activity.id, data.tags);
          console.log('✅ Tags added successfully');
        } catch (tagError: any) {
          console.error('⚠️ Failed to add tags, but activity was created:', tagError);
          // Don't fail the entire operation if tags fail
        }
      }

      // Возвращаем активность с полной информацией
      console.log('🔍 Fetching complete activity data...');
      return this.getActivityById(activity.id);

    } catch (error: any) {
      console.error('❌ Failed to create activity');
      console.error('🔍 Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
        requestData: error.config?.data
      });

      // Provide user-friendly error messages based on status codes
      if (error.response?.status === 400) {
        const errorMsg = error.response?.data?.message || error.message;
        throw new Error(`Invalid activity data: ${errorMsg}`);
      } else if (error.response?.status === 401) {
        throw new Error('Authentication required. Please sign in again.');
      } else if (error.response?.status === 403) {
        throw new Error('Access denied. You do not have permission to create activities.');
      } else if (error.response?.status === 422) {
        const errorMsg = error.response?.data?.message || error.message;
        throw new Error(`Validation error: ${errorMsg}`);
      } else if (error.response?.status >= 500) {
        throw new Error('Server error. Please try again later.');
      }

      throw error;
    }
  }

  /**
   * Обновление активности
   * @param {string} id - ID активности
   * @param {Partial<ActivityFormData>} data - Данные для обновления
   * @param {string} currentUserId - ID текущего пользователя (для проверки прав)
   * @param {UserRole} currentUserRole - Роль текущего пользователя
   * @returns {Promise<Activity>} Обновленная активность
   * @throws {ApiError} Ошибка обновления
   *
   * @example
   * const updated = await activitiesAPI.updateActivity('123', {
   *   title: 'Новое название',
   *   price: 30
   * }, 'user-123', UserRole.ORGANIZER);
   */
  async updateActivity(
    id: string,
    data: Partial<ActivityFormData>,
    currentUserId?: string,
    currentUserRole?: UserRole
  ): Promise<Activity> {
    try {
      // Проверяем права доступа для ORGANIZER
      if (currentUserRole === UserRole.ORGANIZER && currentUserId) {
        const activity = await this.getActivityById(id);
        if (activity.userId !== currentUserId) {
          throw new Error('Access denied: You can only edit your own activities');
        }
      }

      // Загружаем новое изображение, если есть
      let imageUrl = undefined;
      if (data.image) {
        imageUrl = await this.uploadImage(data.image);
      }

      // Подготавливаем данные для обновления
      const updateData: any = {};

      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) {
        updateData.description = data.description;
        updateData.short_description = data.description.substring(0, 97) + '...';
      }
      if (data.type !== undefined) updateData.type = data.type;
      if (data.categoryId !== undefined) updateData.category_id = data.categoryId;
      if (data.location !== undefined) updateData.location = data.location;
      if (data.address !== undefined) updateData.address = data.address;
      if (data.price !== undefined) updateData.price = data.price;
      if (imageUrl !== undefined) updateData.image_url = imageUrl;
      if (data.startDate !== undefined) updateData.start_date = data.startDate;
      if (data.endDate !== undefined) updateData.end_date = data.endDate;
      if (data.maxParticipants !== undefined) updateData.max_participants = data.maxParticipants;
      if (data.minAge !== undefined) updateData.min_age = data.minAge;
      if (data.maxAge !== undefined) updateData.max_age = data.maxAge;
      if (data.contactEmail !== undefined) updateData.contact_email = data.contactEmail;
      if (data.contactPhone !== undefined) updateData.contact_phone = data.contactPhone;
      if (data.externalLink !== undefined) updateData.external_link = data.externalLink;

      // Обновляем активность
      await apiClient.patch(
        `/activities?id=eq.${id}`,
        updateData
      );

      // Обновляем теги, если переданы
      if (data.tags) {
        await this.updateActivityTags(id, data.tags);
      }

      // Возвращаем обновленную активность с полной информацией
      return this.getActivityById(id);
    } catch (error) {
      console.error('Ошибка обновления активности:', error);
      throw error;
    }
  }

  /**
   * Мягкое удаление активности (перемещение в корзину)
   * @param {string} id - ID активности
   * @param {string} currentUserId - ID текущего пользователя (для проверки прав)
   * @param {UserRole} currentUserRole - Роль текущего пользователя
   * @returns {Promise<void>}
   * @throws {ApiError} Ошибка удаления
   *
   * @example
   * await activitiesAPI.softDeleteActivity('123', 'user-123', UserRole.ORGANIZER);
   */
  async softDeleteActivity(
    id: string,
    currentUserId?: string,
    currentUserRole?: UserRole
  ): Promise<void> {
    try {
      // Проверяем права доступа для ORGANIZER
      if (currentUserRole === UserRole.ORGANIZER && currentUserId) {
        const activity = await this.getActivityById(id);
        if (activity.userId !== currentUserId) {
          throw new Error('Access denied: You can only delete your own activities');
        }
      }

      await apiClient.patch(
        `/activities?id=eq.${id}`,
        { is_deleted: true }
      );
    } catch (error) {
      console.error('Ошибка удаления активности:', error);
      throw error;
    }
  }

  /**
   * Восстановление активности из корзины
   * @param {string} id - ID активности
   * @param {string} currentUserId - ID текущего пользователя (для проверки прав)
   * @param {UserRole} currentUserRole - Роль текущего пользователя
   * @returns {Promise<void>}
   * @throws {ApiError} Ошибка восстановления
   *
   * @example
   * await activitiesAPI.restoreActivity('123', 'user-123', UserRole.ORGANIZER);
   */
  async restoreActivity(
    id: string,
    currentUserId?: string,
    currentUserRole?: UserRole
  ): Promise<void> {
    try {
      // Проверяем права доступа для ORGANIZER
      if (currentUserRole === UserRole.ORGANIZER && currentUserId) {
        const activity = await this.getActivityById(id);
        if (activity.userId !== currentUserId) {
          throw new Error('Access denied: You can only restore your own activities');
        }
      }

      await apiClient.patch(
        `/activities?id=eq.${id}`,
        { is_deleted: false }
      );
    } catch (error) {
      console.error('Ошибка восстановления активности:', error);
      throw error;
    }
  }

  /**
   * Обычное удаление активности (алиас для softDeleteActivity)
   * @param {string} id - ID активности
   * @param {string} currentUserId - ID текущего пользователя (для проверки прав)
   * @param {UserRole} currentUserRole - Роль текущего пользователя
   * @returns {Promise<void>}
   * @throws {ApiError} Ошибка удаления
   */
  async deleteActivity(
    id: string,
    currentUserId?: string,
    currentUserRole?: UserRole
  ): Promise<void> {
    return this.softDeleteActivity(id, currentUserId, currentUserRole);
  }

  /**
   * Получение одной активности по ID (алиас для getActivityById)
   * @param {string} id - ID активности
   * @returns {Promise<Activity>} Активность с полной информацией
   */
  async getActivity(id: string): Promise<Activity> {
    return this.getActivityById(id);
  }

  /**
   * Получение удаленных активностей для корзины
   * @param {number} page - Номер страницы
   * @param {number} limit - Количество элементов на странице
   * @param {string} currentUserId - ID текущего пользователя (для ORGANIZER - показывать только свои)
   * @param {UserRole} currentUserRole - Роль текущего пользователя
   * @returns {Promise<ApiListResponse<Activity>>} Список удаленных активностей
   */
  async getDeletedActivities(
    page: number = 1,
    limit: number = API_CONSTANTS.DEFAULT_PAGE_SIZE,
    currentUserId?: string,
    currentUserRole?: UserRole,
    search?: string
  ): Promise<ApiListResponse<Activity>> {
    try {
      const queryParams: Record<string, any> = {
        // boolean filter: use PostgREST `is.true` for clarity
        is_deleted: 'is.true'
      };

      // Ограничиваем доступ для ORGANIZER - только свои активности
      if (currentUserRole === UserRole.ORGANIZER && currentUserId) {
        queryParams.user_id = `eq.${currentUserId}`;
      }

      if (search) {
        queryParams.or = `(title.ilike.*${search}*,organizer_name.ilike.*${search}*,location.ilike.*${search}*)`;
      }

      const filterQuery = buildFilterQuery(queryParams);
      const orderQuery = buildOrderQuery('updated_at', false);
      const paginationConfig = buildPaginationConfig(page, limit);

      const response: AxiosResponse<any[]> = await apiClient.get(
        `${this.fullViewEndpoint}?${filterQuery}&order=${orderQuery}&select=*`,
        paginationConfig
      );

      const contentRange = response.headers['content-range'];
      const total = contentRange ? parseInt(contentRange.split('/')[1]) : 0;

      const activities = response.data.map(this.transformActivity);

      return {
        data: activities,
        pagination: {
          page,
          limit,
          total
        },
        total
      };
    } catch (error) {
      console.error('Ошибка получения удаленных активностей:', error);
      throw error;
    }
  }

  /**
   * Полное удаление активности
   * @param {string} id - ID активности
   * @param {string} currentUserId - ID текущего пользователя (для проверки прав)
   * @param {UserRole} currentUserRole - Роль текущего пользователя
   * @returns {Promise<void>}
   * @throws {ApiError} Ошибка удаления
   *
   * @example
   * await activitiesAPI.permanentDeleteActivity('123', 'user-123', UserRole.ORGANIZER);
   */
  async permanentDeleteActivity(
    id: string,
    currentUserId?: string,
    currentUserRole?: UserRole
  ): Promise<void> {
    try {
      // Получаем активность для удаления изображения
      const activity = await this.getActivityById(id);

      // Проверяем права доступа для ORGANIZER
      if (currentUserRole === UserRole.ORGANIZER && currentUserId) {
        if (activity.userId !== currentUserId) {
          throw new Error('Access denied: You can only permanently delete your own activities');
        }
      }

      // Удаляем изображение из хранилища
      if (activity.imageUrl) {
        await this.deleteImage(activity.imageUrl);
      }

      // Удаляем активность из базы данных
      await apiClient.delete(`/activities?id=eq.${id}`);
    } catch (error) {
      console.error('Ошибка полного удаления активности:', error);
      throw error;
    }
  }

  /**
   * Получение всех активностей для админ-панели (включая неподтвержденные)
   * @param {ActivityFilters} filters - Фильтры для поиска
   * @param {number} page - Номер страницы
   * @param {number} limit - Количество элементов на странице
   * @param {string} orderBy - Поле для сортировки
   * @param {boolean} ascending - Направление сортировки
   * @param {string} currentUserId - ID текущего пользователя
   * @param {UserRole} currentUserRole - Роль текущего пользователя
   * @returns {Promise<ApiListResponse<Activity>>} Список всех активностей для админа
   */
  async getAllActivitiesForAdmin(
    filters: ActivityFilters = {},
    page: number = 1,
    limit: number = API_CONSTANTS.DEFAULT_PAGE_SIZE,
    orderBy: string = 'created_at',
    ascending: boolean = false,
    currentUserId?: string,
    currentUserRole?: UserRole
  ): Promise<ApiListResponse<Activity>> {
    try {
      // Подготавливаем параметры запроса
      const queryParams: Record<string, any> = {
        is_deleted: 'is.false', // Исключаем только удаленные
      };

      // Требование: администраторы не видят pending (показываем только одобренные),
      // организаторы видят свои активности, включая не одобренные
      if (currentUserRole === UserRole.ADMIN) {
        queryParams.isApproved = 'eq.true';
      }

      // Ограничиваем доступ для ORGANIZER - только свои активности
      if (currentUserRole === UserRole.ORGANIZER && currentUserId) {
        queryParams.user_id = `eq.${currentUserId}`;
      }

      // Добавляем фильтры
      if (filters.search) {
        queryParams.or = `(title.ilike.*${filters.search}*,description.ilike.*${filters.search}*,location.ilike.*${filters.search}*,organizer_name.ilike.*${filters.search}*)`;
      }

      if (filters.categoryId) {
        queryParams.category_id = `eq.${filters.categoryId}`;
      }

      if (filters.type) {
        queryParams.type = `eq.${filters.type}`;
      }

      if (filters.location) {
        queryParams.location = `ilike.*${filters.location}*`;
      }

      if (filters.freeOnly) {
        queryParams.price = 'eq.0';
      } else {
        if (filters.minPrice !== undefined) {
          queryParams.price = `gte.${filters.minPrice}`;
        }
        if (filters.maxPrice !== undefined) {
          queryParams.price = `${queryParams.price ? queryParams.price + ',' : ''}lte.${filters.maxPrice}`;
        }
      }

      // Строим URL с параметрами
      const filterQuery = buildFilterQuery(queryParams);
      const orderQuery = buildOrderQuery(orderBy, ascending);
      const paginationConfig = buildPaginationConfig(page, limit);

      const response: AxiosResponse<any[]> = await apiClient.get(
        `${this.fullViewEndpoint}?${filterQuery}&order=${orderQuery}&select=*`,
        paginationConfig
      );

      const contentRange = response.headers['content-range'];
      const total = contentRange ? parseInt(contentRange.split('/')[1]) : 0;

      const activities = response.data.map(this.transformActivity);

      return {
        data: activities,
        pagination: {
          page,
          limit,
          total
        },
        total
      };
    } catch (error) {
      console.error('Ошибка получения всех активностей для админа:', error);
      throw error;
    }
  }

  /**
   * Получение активностей пользователя
   * @param {string} userId - ID пользователя
   * @param {boolean} includeDeleted - Включать удаленные активности
   * @param {string} currentUserId - ID текущего пользователя (для проверки прав)
   * @param {UserRole} currentUserRole - Роль текущего пользователя
   * @returns {Promise<Activity[]>} Список активностей пользователя
   *
   * @example
   * const userActivities = await activitiesAPI.getUserActivities('user-123', false, 'current-user', UserRole.ORGANIZER);
   */
  async getUserActivities(
    userId: string,
    includeDeleted: boolean = false,
    currentUserId?: string,
    currentUserRole?: UserRole
  ): Promise<Activity[]> {
    try {
      // ORGANIZER может видеть только свои активности
      if (currentUserRole === UserRole.ORGANIZER && currentUserId && userId !== currentUserId) {
        return []; // Возвращаем пустой массив если пытается получить чужие активности
      }

      const filters: string[] = [`user_id=eq.${userId}`];
      if (!includeDeleted) {
        filters.push('is_deleted=is.false');
      }
      const query = `${this.fullViewEndpoint}?${filters.join('&')}&select=*`;

      const response: AxiosResponse<any[]> = await apiClient.get(query);

      return response.data.map(this.transformActivity.bind(this));
    } catch (error) {
      console.error('Ошибка получения активностей пользователя:', error);
      throw error;
    }
  }

  /**
   * Получение всех категорий
   * @returns {Promise<Category[]>} Список категорий
   *
   * @example
   * const categories = await activitiesAPI.getCategories();
   */
  async getCategories(): Promise<Category[]> {
    try {
      const response: AxiosResponse<Category[]> = await apiClient.get('/categories');
      return response.data;
    } catch (error) {
      console.error('Ошибка получения категорий:', error);
      throw error;
    }
  }

  /**
   * Получение всех тегов
   * @returns {Promise<Tag[]>} Список тегов
   *
   * @example
   * const tags = await activitiesAPI.getTags();
   */
  async getTags(): Promise<Tag[]> {
    try {
      const response: AxiosResponse<Tag[]> = await apiClient.get('/tags');
      return response.data;
    } catch (error) {
      console.error('Ошибка получения тегов:', error);
      throw error;
    }
  }

  /**
   * Получение всех типов активностей
   * @returns {Promise<ActivityType[]>} Список типов активностей
   *
   * @example
   * const types = await activitiesAPI.getActivityTypes();
   */
  async getActivityTypes(): Promise<{id: string, name: string, value: string}[]> {
    try {
      const response: AxiosResponse<{id: string, name: string, value: string}[]> = await apiClient.get('/activity_types');
      return response.data;
    } catch (error) {
      console.error('Ошибка получения типов активностей:', error);
      // Fallback - возвращаем статичные типы если таблица не существует
      return [
        { id: '1', name: 'Activity', value: 'activity' },
        { id: '2', name: 'Event', value: 'event' },
        { id: '3', name: 'Hobby Opportunity', value: 'hobby_opportunity' },
        { id: '4', name: 'Club', value: 'club' },
        { id: '5', name: 'Competition', value: 'competition' }
      ];
    }
  }

  /**
   * Поиск активностей (полнотекстовый поиск)
   * @param {string} query - Поисковый запрос
   * @param {number} page - Номер страницы
   * @param {number} limit - Количество элементов
   * @returns {Promise<ApiListResponse<Activity>>} Результаты поиска
   *
   * @example
   * const results = await activitiesAPI.searchActivities('футбол');
   */
  async searchActivities(
    query: string,
    page: number = 1,
    limit: number = API_CONSTANTS.DEFAULT_PAGE_SIZE
  ): Promise<ApiListResponse<Activity>> {
    try {
      // Используем функцию поиска на бэкенде
      const response: AxiosResponse<Activity[]> = await apiClient.post(
        '/rpc/search_activities',
        { search_query: query },
        buildPaginationConfig(page, limit)
      );

      // Получаем общее количество из заголовка
      const contentRange = response.headers['content-range'];
      const total = contentRange ? parseInt(contentRange.split('/')[1]) : 0;

      return {
        data: response.data.map(this.transformActivity),
        pagination: { page, limit, total },
        total
      };
    } catch (error) {
      console.error('Ошибка поиска активностей:', error);
      throw error;
    }
  }

  // ====================== ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ ======================

  /**
   * Преобразование данных активности из API формата
   * @private
   * @param {any} activity - Сырые данные из API
   * @returns {Activity} Преобразованная активность
   */
  private transformActivity(activity: any): Activity {
    return {
      id: activity.id,
      title: activity.title,
      description: activity.description,
      shortDescription: activity.short_description,
      type: activity.type,
      categoryId: activity.category_id,
      category: {
        id: activity.category_id,
        name: activity.category_name,
        icon: activity.category_icon,
      } as Category,
      location: activity.location,
      address: activity.address,
      coordinates: activity.coordinates,
      price: activity.price,
      currency: activity.currency || 'EUR',
      imageUrl: activity.image_url,
      userId: activity.user_id,
      organizer: {
        id: activity.user_id,
        fullName: activity.organizer_name,
        organizationName: activity.organizer_organization,
        email: activity.organizer_email,
        photoUrl: activity.organizer_photo_url,
        role: UserRole.ORGANIZER, // Assuming role from context, as it's not in the view
        isApproved: true, // Assuming approved, not available in view
      } as User,
      tags: activity.tags || [],
      startDate: activity.start_date ? new Date(activity.start_date) : undefined,
      endDate: activity.end_date ? new Date(activity.end_date) : undefined,
      maxParticipants: activity.max_participants,
      minAge: activity.min_age,
      maxAge: activity.max_age,
      contactEmail: activity.contact_email,
      contactPhone: activity.contact_phone,
      externalLink: activity.external_link,
      isDeleted: activity.is_deleted,
      isApproved: activity.isApproved || false,
      createdAt: new Date(activity.created_at),
      updatedAt: new Date(activity.updated_at)
    };
  }

  /**
   * Загрузка изображения в хранилище
   * @private
   * @param {File} file - Файл изображения
   * @returns {Promise<string>} URL загруженного изображения
   */
  private async uploadImage(file: File): Promise<string> {
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `activities/${fileName}`;

      const formData = new FormData();
      formData.append('file', file);

      await storageClient.post(
        `/object/${API_CONSTANTS.STORAGE_BUCKET}/${filePath}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      // Возвращаем публичный URL
      return `${storageClient.defaults.baseURL}/object/public/${API_CONSTANTS.STORAGE_BUCKET}/${filePath}`;
    } catch (error) {
      console.error('Ошибка загрузки изображения:', error);
      throw error;
    }
  }

  /**
   * Удаление изображения из хранилища
   * @private
   * @param {string} imageUrl - URL изображения
   * @returns {Promise<void>}
   */
  private async deleteImage(imageUrl: string): Promise<void> {
    try {
      // Извлекаем путь файла из URL
      const urlParts = imageUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `activities/${fileName}`;

      await storageClient.delete(
        `/object/${API_CONSTANTS.STORAGE_BUCKET}/${filePath}`
      );
    } catch (error) {
      console.error('Ошибка удаления изображения:', error);
      // Не выбрасываем ошибку, так как удаление изображения не критично
    }
  }

  /**
   * Добавление тегов к активности
   * @private
   * @param {string} activityId - ID активности
   * @param {string[]} tagIds - Массив ID тегов
   * @returns {Promise<void>}
   */
  private async addTagsToActivity(activityId: string, tagIds: string[]): Promise<void> {
    try {
      const tagRelations = tagIds.map(tagId => ({
        activity_id: activityId,
        tag_id: tagId
      }));

      await apiClient.post('/activity_tags', tagRelations);
    } catch (error) {
      console.error('Ошибка добавления тегов:', error);
      throw error;
    }
  }

  /**
   * Обновление тегов активности
   * @private
   * @param {string} activityId - ID активности
   * @param {string[]} tagIds - Новый массив ID тегов
   * @returns {Promise<void>}
   */
  private async updateActivityTags(activityId: string, tagIds: string[]): Promise<void> {
    try {
      // Удаляем старые связи
      await apiClient.delete(`/activity_tags?activity_id=eq.${activityId}`);

      // Добавляем новые
      if (tagIds.length > 0) {
        await this.addTagsToActivity(activityId, tagIds);
      }
    } catch (error) {
      console.error('Ошибка обновления тегов:', error);
      throw error;
    }
  }

  /**
   * Одобрение/отклонение активности
   * @param {string} id - ID активности
   * @param {boolean} isApproved - Статус одобрения
   * @returns {Promise<Activity>} Обновленные данные активности
   */
  async approveActivity(id: string, isApproved: boolean): Promise<Activity> {
    try {
      // Note: Using 'isApproved' as per Supabase OpenAPI schema
      const response = await apiClient.patch(
        `${this.endpoint}?id=eq.${id}`,
        { isApproved }
      );

      if (!response.data || response.data.length === 0) {
        throw new Error('Failed to update activity approval status');
      }

      return this.transformActivity(response.data[0]);
    } catch (error) {
      console.error('Ошибка обновления статуса одобрения активности:', error);
      throw error;
    }
  }

  /**
   * Получение статистики активностей
   * @returns {Promise<{total: number, approved: number, pending: number, deleted: number}>}
   */
  async getActivitiesStats(): Promise<{
    total: number;
    approved: number;
    pending: number;
    deleted: number;
  }> {
    try {
      const [totalResponse, approvedResponse, pendingResponse, deletedResponse] = await Promise.all([
        apiClient.get(`${this.endpoint}?select=count`),
        apiClient.get(`${this.endpoint}?isApproved=eq.true&is_deleted=eq.false&select=count`),
        apiClient.get(`${this.endpoint}?isApproved=eq.false&is_deleted=eq.false&select=count`),
        apiClient.get(`${this.endpoint}?is_deleted=eq.true&select=count`)
      ]);

      return {
        total: totalResponse.data[0]?.count || 0,
        approved: approvedResponse.data[0]?.count || 0,
        pending: pendingResponse.data[0]?.count || 0,
        deleted: deletedResponse.data[0]?.count || 0
      };
    } catch (error) {
      console.error('Ошибка получения статистики активностей:', error);
      throw error;
    }
  }

  /**
   * Получение активностей, ожидающих одобрения
   * @param {Object} params - Параметры запроса
   * @param {number} params.page - Номер страницы
   * @param {number} params.limit - Количество элементов на странице
   * @returns {Promise<ApiListResponse<Activity>>} Список активностей
   */
  async getPendingActivities(params: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}): Promise<ApiListResponse<Activity>> {
    try {
      const { page = 1, limit = 20, search } = params;

      // Build filters safely to avoid malformed URLs
      // Note: Using 'isApproved' as per Supabase OpenAPI schema
      const filterMap: Record<string, any> = {
        isApproved: 'eq.false',
        is_deleted: 'is.false',
      };
      if (search) {
        filterMap.or = `(title.ilike.*${search}*,description.ilike.*${search}*,location.ilike.*${search}*,organizer_name.ilike.*${search}*)`;
      }
      const filterQuery = buildFilterQuery(filterMap);
      const url = `${this.fullViewEndpoint}?${filterQuery}&order=created_at.desc&select=*`;

      const response = await apiClient.get(url, buildPaginationConfig(page, limit));

      const activities = response.data.map(this.transformActivity.bind(this));
      const total = parseInt(response.headers['content-range']?.split('/')[1] || '0');

      return {
        data: activities,
        pagination: { page, limit, total },
        total
      };
    } catch (error) {
      console.error('Ошибка получения активностей на модерации:', error);
      throw error;
    }
  }
}

// Создаем и экспортируем единственный экземпляр
const activitiesAPI = new ActivitiesAPI();
export default activitiesAPI;
