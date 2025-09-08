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
  Tag 
} from '../types';
import { AxiosResponse } from 'axios';

/**
 * Класс для работы с активностями
 * @class
 * @description Предоставляет методы для создания, чтения, обновления и удаления активностей
 */
class ActivitiesAPI {
  /**
   * Получение списка активностей с фильтрацией и пагинацией
   * @param {ActivityFilters} filters - Фильтры для поиска
   * @param {number} page - Номер страницы (начиная с 1)
   * @param {number} limit - Количество элементов на странице
   * @param {string} orderBy - Поле для сортировки
   * @param {boolean} ascending - Направление сортировки
   * @returns {Promise<ApiListResponse<Activity>>} Список активностей с метаданными
   * 
   * @example
   * const activities = await activitiesAPI.getActivities(
   *   { categoryId: '123', freeOnly: true },
   *   1,
   *   20,
   *   'created_at',
   *   false
   * );
   */
  async getActivities(
    filters: ActivityFilters = {},
    page: number = 1,
    limit: number = API_CONSTANTS.DEFAULT_PAGE_SIZE,
    orderBy: string = 'created_at',
    ascending: boolean = false
  ): Promise<ApiListResponse<Activity>> {
    try {
      // Подготавливаем параметры запроса
      const queryParams: Record<string, any> = {
        is_deleted: false, // Не показываем удаленные активности
      };

      // Добавляем фильтры
      if (filters.search) {
        // Для текстового поиска используем специальную функцию на бэкенде
        queryParams.or = `(title.ilike.*${filters.search}*,description.ilike.*${filters.search}*,location.ilike.*${filters.search}*)`;
      }

      if (filters.categoryId) {
        queryParams.category_id = filters.categoryId;
      }

      if (filters.type) {
        queryParams.type = filters.type;
      }

      if (filters.location) {
        queryParams.location = `ilike.*${filters.location}*`;
      }

      if (filters.freeOnly) {
        queryParams.price = 0;
      } else {
        if (filters.minPrice !== undefined) {
          queryParams.price = `gte.${filters.minPrice}`;
        }
        if (filters.maxPrice !== undefined) {
          queryParams.price = `lte.${filters.maxPrice}`;
        }
      }

      // Строим URL с параметрами
      const filterQuery = buildFilterQuery(queryParams);
      const orderQuery = buildOrderQuery(orderBy, ascending);
      const paginationConfig = buildPaginationConfig(page, limit);

      // Выполняем запрос
      const response: AxiosResponse<Activity[]> = await apiClient.get(
        `/activities?${filterQuery}&order=${orderQuery}&select=*,category:categories(*),tags:activity_tags(tag:tags(*))`,
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
      const response: AxiosResponse<Activity[]> = await apiClient.get(
        `/activities?id=eq.${id}&select=*,category:categories(*),tags:activity_tags(tag:tags(*)),organizer:user_profiles(*)`
      );

      if (!response.data || response.data.length === 0) {
        throw new Error('Активность не найдена');
      }

      return this.transformActivity(response.data[0]);
    } catch (error) {
      console.error('Ошибка получения активности:', error);
      throw error;
    }
  }

  /**
   * Создание новой активности
   * @param {ActivityFormData} data - Данные для создания активности
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
   * });
   */
  async createActivity(data: ActivityFormData): Promise<Activity> {
    try {
      // Загружаем изображение, если есть
      let imageUrl = null;
      if (data.image) {
        imageUrl = await this.uploadImage(data.image);
      }

      // Подготавливаем данные для создания
      const activityData = {
        title: data.title,
        description: data.description,
        short_description: data.description.substring(0, 97) + '...',
        type: data.type,
        category_id: data.categoryId,
        location: data.location,
        address: data.address,
        price: data.price || 0,
        image_url: imageUrl,
        start_date: data.startDate,
        end_date: data.endDate,
        max_participants: data.maxParticipants,
        min_age: data.minAge,
        max_age: data.maxAge,
        contact_email: data.contactEmail,
        contact_phone: data.contactPhone,
        external_link: data.externalLink
      };

      // Создаем активность
      const response: AxiosResponse<Activity[]> = await apiClient.post(
        '/activities',
        activityData
      );

      const activity = response.data[0];

      // Добавляем теги
      if (data.tags && data.tags.length > 0) {
        await this.addTagsToActivity(activity.id, data.tags);
      }

      // Возвращаем активность с полной информацией
      return this.getActivityById(activity.id);
    } catch (error) {
      console.error('Ошибка создания активности:', error);
      throw error;
    }
  }

  /**
   * Обновление активности
   * @param {string} id - ID активности
   * @param {Partial<ActivityFormData>} data - Данные для обновления
   * @returns {Promise<Activity>} Обновленная активность
   * @throws {ApiError} Ошибка обновления
   * 
   * @example
   * const updated = await activitiesAPI.updateActivity('123', {
   *   title: 'Новое название',
   *   price: 30
   * });
   */
  async updateActivity(id: string, data: Partial<ActivityFormData>): Promise<Activity> {
    try {
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
      const response: AxiosResponse<Activity[]> = await apiClient.patch(
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
   * @returns {Promise<void>}
   * @throws {ApiError} Ошибка удаления
   * 
   * @example
   * await activitiesAPI.softDeleteActivity('123');
   */
  async softDeleteActivity(id: string): Promise<void> {
    try {
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
   * @returns {Promise<void>}
   * @throws {ApiError} Ошибка восстановления
   * 
   * @example
   * await activitiesAPI.restoreActivity('123');
   */
  async restoreActivity(id: string): Promise<void> {
    try {
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
   * Полное удаление активности
   * @param {string} id - ID активности
   * @returns {Promise<void>}
   * @throws {ApiError} Ошибка удаления
   * 
   * @example
   * await activitiesAPI.deleteActivityPermanently('123');
   */
  async deleteActivityPermanently(id: string): Promise<void> {
    try {
      // Получаем активность для удаления изображения
      const activity = await this.getActivityById(id);
      
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
   * Получение активностей пользователя
   * @param {string} userId - ID пользователя
   * @param {boolean} includeDeleted - Включать удаленные активности
   * @returns {Promise<Activity[]>} Список активностей пользователя
   * 
   * @example
   * const userActivities = await activitiesAPI.getUserActivities('user-123');
   */
  async getUserActivities(userId: string, includeDeleted: boolean = false): Promise<Activity[]> {
    try {
      let query = `/activities?user_id=eq.${userId}`;
      
      if (!includeDeleted) {
        query += '&is_deleted=eq.false';
      }
      
      query += '&select=*,category:categories(*),tags:activity_tags(tag:tags(*))';

      const response: AxiosResponse<Activity[]> = await apiClient.get(query);
      
      return response.data.map(this.transformActivity);
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
      category: activity.category,
      location: activity.location,
      address: activity.address,
      coordinates: activity.coordinates,
      price: activity.price,
      currency: activity.currency || 'EUR',
      imageUrl: activity.image_url,
      userId: activity.user_id,
      organizer: activity.organizer,
      tags: activity.tags?.map((at: any) => at.tag) || [],
      startDate: activity.start_date ? new Date(activity.start_date) : undefined,
      endDate: activity.end_date ? new Date(activity.end_date) : undefined,
      maxParticipants: activity.max_participants,
      minAge: activity.min_age,
      maxAge: activity.max_age,
      contactEmail: activity.contact_email,
      contactPhone: activity.contact_phone,
      externalLink: activity.external_link,
      isDeleted: activity.is_deleted,
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

      const response = await storageClient.post(
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
}

// Создаем и экспортируем единственный экземпляр
const activitiesAPI = new ActivitiesAPI();
export default activitiesAPI;
