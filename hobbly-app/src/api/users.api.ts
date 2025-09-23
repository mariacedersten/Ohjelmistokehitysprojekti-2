/**
 * @fileoverview API для работы с пользователями
 * @module api/users
 * @description Функции для управления пользователями в админ-панели
 */

import { apiClient, buildPaginationConfig, buildFilterQuery } from './config';
import { User, ApiListResponse, PaginationParams } from '../types';

/**
 * Класс для работы с пользователями API
 * @class UsersAPI
 */
export class UsersAPI {
  private readonly endpoint = '/user_profiles';

  /**
   * Получение списка пользователей с пагинацией и фильтрацией
   * @param {Object} params - Параметры запроса
   * @param {number} params.page - Номер страницы
   * @param {number} params.limit - Количество элементов на странице
   * @param {string} params.search - Поисковый запрос
   * @param {string} params.role - Фильтр по роли
   * @param {boolean} params.isApproved - Фильтр по статусу подтверждения
   * @returns {Promise<ApiListResponse<User>>} Список пользователей
   */
  async getUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    isApproved?: boolean;
  } = {}): Promise<ApiListResponse<User>> {
    try {
      const { page = 1, limit = 20, search, role, isApproved } = params;

      const filters: Record<string, any> = {};
      const queryParts: string[] = [];

      // Handle search with 'or' parameter separately
      if (search) {
        const searchTerm = encodeURIComponent(search);
        queryParts.push(`or=(full_name.ilike.*${searchTerm}*,email.ilike.*${searchTerm}*,organization_name.ilike.*${searchTerm}*)`);
      }

      if (role) {
        filters.role = `eq.${role}`;
      }

      if (isApproved !== undefined) {
        filters.isApproved = `eq.${isApproved}`;
      }

      // Build query string manually to properly handle 'or' parameter
      const filterQuery = buildFilterQuery(filters);
      if (filterQuery) {
        queryParts.push(filterQuery);
      }

      const queryString = queryParts.join('&');
      const url = `${this.endpoint}?${queryString}&order=created_at.desc`;

      console.log('Users API URL:', url); // Debug log

      const response = await apiClient.get(url, buildPaginationConfig(page, limit));
      
      const users = response.data.map(this.transformUser);
      const total = parseInt(response.headers['content-range']?.split('/')[1] || '0');

      return {
        data: users,
        pagination: { page, limit, total },
        total
      };
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  }

  /**
   * Получение пользователя по ID
   * @param {string} id - ID пользователя
   * @returns {Promise<User>} Данные пользователя
   */
  async getUser(id: string): Promise<User> {
    try {
      const response = await apiClient.get(`${this.endpoint}?id=eq.${id}&select=*`);
      //console.log('getUser response:!!!!!!!!!!!!!!!!!', "!!!!!!!!!!!!!!!!!"+response.data);
      if (!response.data || response.data.length === 0) {
        throw new Error('User not found');
      }

      return this.transformUser(response.data[0]);
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  /**
   * Одобрение/отклонение пользователя
   * @param {string} id - ID пользователя
   * @param {boolean} isApproved - Статус одобрения
   * @returns {Promise<User>} Обновленные данные пользователя
   */
  async approveUser(id: string, isApproved: boolean): Promise<User> {
    try {
      const response = await apiClient.patch(
        `${this.endpoint}?id=eq.${id}`,
        { isApproved }
      );

      if (!response.data || response.data.length === 0) {
        throw new Error('Failed to update user approval status');
      }

      return this.transformUser(response.data[0]);
    } catch (error) {
      console.error('Error updating user approval:', error);
      throw error;
    }
  }

  /**
   * Обновление профиля пользователя
   * @param {string} id - ID пользователя
   * @param {Partial<User>} data - Данные для обновления
   * @returns {Promise<User>} Обновленные данные пользователя
   */
  async updateUser(id: string, data: Partial<User>): Promise<User> {
    try {
      const updateData: Record<string, any> = {};
      
      if (data.fullName) updateData.full_name = data.fullName;
      if (data.organizationName) updateData.organization_name = data.organizationName;
      if (data.phone) updateData.phone = data.phone;
      if (data.role) updateData.role = data.role;
      if (data.isApproved !== undefined) updateData.isApproved = data.isApproved;

      const response = await apiClient.patch(
        `${this.endpoint}?id=eq.${id}`,
        updateData
      );

      if (!response.data || response.data.length === 0) {
        throw new Error('Failed to update user');
      }

      return this.transformUser(response.data[0]);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Удаление пользователя
   * @param {string} id - ID пользователя
   * @returns {Promise<void>}
   */
  async deleteUser(id: string): Promise<void> {
    try {
      // В Supabase мы не можем напрямую удалить пользователя из auth.users
      // Вместо этого отмечаем профиль как удаленный или деактивированный
      await apiClient.patch(
        `${this.endpoint}?id=eq.${id}`,
        { isApproved: false }
      );
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Получение статистики пользователей
   * @returns {Promise<{total: number, approved: number, pending: number, organizers: number, admins: number}>}
   */
  async getUsersStats(): Promise<{
    total: number;
    approved: number;
    pending: number;
    organizers: number;
    admins: number;
  }> {
    try {
      const [totalResponse, approvedResponse, pendingResponse, organizersResponse, adminsResponse] = await Promise.all([
        apiClient.get(`${this.endpoint}?select=count`),
        apiClient.get(`${this.endpoint}?isApproved=eq.true&select=count`),
        apiClient.get(`${this.endpoint}?isApproved=eq.false&select=count`),
        apiClient.get(`${this.endpoint}?role=eq.organizer&select=count`),
        apiClient.get(`${this.endpoint}?role=eq.admin&select=count`)
      ]);

      return {
        total: totalResponse.data[0]?.count || 0,
        approved: approvedResponse.data[0]?.count || 0,
        pending: pendingResponse.data[0]?.count || 0,
        organizers: organizersResponse.data[0]?.count || 0,
        admins: adminsResponse.data[0]?.count || 0
      };
    } catch (error) {
      console.error('Error fetching users stats:', error);
      throw error;
    }
  }

  /**
   * Преобразование данных пользователя из API формата
   * @private
   * @param {any} user - Сырые данные из API
   * @returns {User} Преобразованный пользователь
   */
  private transformUser(user: any): User {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      organizationName: user.organization_name,
      fullName: user.full_name,
      phone: user.phone,
      address: user.address,
      organizationAddress: user.organization_address,
      organizationNumber: user.organization_number,
      photoUrl: user.avatar_url, // Маппинг аватара из БД
      isApproved: user.isApproved || false,
      createdAt: new Date(user.created_at),
      updatedAt: new Date(user.updated_at)
    };
  }
}

// Экспорт единственного экземпляра
export default new UsersAPI();