/**
 * @fileoverview API сервис для аутентификации пользователей
 * @module api/auth
 * @description Обеспечивает функции регистрации, входа, выхода и управления профилем
 * через Supabase REST API
 */

import { authClient, apiClient, setAuthToken, removeAuthToken, storageClient } from './config';
import { User, SignInFormData, SignUpFormData, UserRole } from '../types';
import { AxiosResponse } from 'axios';
import { v4 as uuidv4 } from 'uuid';

/**
 * Интерфейс ответа при успешной аутентификации
 */
interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  user: SupabaseUser;
}

/**
 * Интерфейс ответа для методов аутентификации
 */
interface AuthResult {
  user: User;
  token: string;
}

/**
 * Интерфейс пользователя Supabase
 */
interface SupabaseUser {
  id: string;
  email: string;
  email_confirmed_at?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
  user_metadata?: {
    fullName?: string;
    organizationName?: string;
    role?: UserRole;
    isApproved?: boolean;
    address?: string;
    organizationAddress?: string;
    organizationNumber?: string;
    photoUrl?: string;
  };
}

/**
 * Преобразование профиля пользователя из таблицы user_profiles в локальный формат
 * @param {any} profile - Профиль из таблицы user_profiles
 * @returns {User} Преобразованный пользователь
 */
const transformUserProfile = (profile: any): User => {
  console.log('transformUserProfile input:', profile);
  
  const user: User = {
    id: profile.id,
    email: profile.email,
    role: profile.role as UserRole, // РОЛЬ ИЗ ТАБЛИЦЫ user_profiles!
    organizationName: profile.organization_name,
    fullName: profile.full_name,
    phone: profile.phone,
    address: profile.address, // если есть в БД
    organizationAddress: profile.organization_address, // если есть в БД
    organizationNumber: profile.organization_number, // если есть в БД
    photoUrl: profile.avatar_url, // в БД называется avatar_url
    isApproved: profile.isApproved || false,
    createdAt: new Date(profile.created_at),
    updatedAt: new Date(profile.updated_at)
  };
  
  console.log('transformUserProfile output:', user);
  return user;
};

/**
 * Преобразование пользователя Supabase из ответа GoTrue (auth) в локальный формат
 * @param {SupabaseUser} supabaseUser - Пользователь из ответа Supabase Auth
 * @returns {User} Преобразованный пользователь
 * @throws {Error} Если supabaseUser равен null или undefined
 */
const transformSupabaseUser = (supabaseUser: SupabaseUser): User => {
  // Валидация входящих данных
  if (!supabaseUser) {
    throw new Error('transformSupabaseUser: supabaseUser is null or undefined');
  }

  if (!supabaseUser.id || !supabaseUser.email) {
    throw new Error('transformSupabaseUser: missing required fields (id, email)');
  }

  const metadata = supabaseUser.user_metadata || {} as any;
  
  console.log('transformSupabaseUser input:', {
    id: supabaseUser.id,
    email: supabaseUser.email,
    has_metadata: !!supabaseUser.user_metadata,
    metadata_keys: Object.keys(metadata)
  });

  const user: User = {
    id: supabaseUser.id,
    email: supabaseUser.email,
    role: metadata.role || UserRole.USER, // Default to USER if not specified
    fullName: metadata.fullName,
    phone: metadata.phone || supabaseUser.phone, // Phone теперь в метаданных (с fallback)
    address: metadata.address,
    organizationName: metadata.organizationName,
    organizationAddress: metadata.organizationAddress,
    organizationNumber: metadata.organizationNumber,
    photoUrl: metadata.photoUrl,
    isApproved: false, // New users are never approved by default
    createdAt: new Date(supabaseUser.created_at),
    updatedAt: new Date(supabaseUser.updated_at),
  };
  
  console.log('transformSupabaseUser output:', user);
  return user;
};

/**
 * Класс для работы с аутентификацией
 * @class
 */
class AuthAPI {
  /**
   * Альтернативный метод загрузки через Supabase JS Client
   * @private
   * @param {File} file - Файл изображения
   * @returns {Promise<string>} URL загруженного изображения
   */
  private async uploadProfilePhotoAlternative(file: File): Promise<string> {
    try {
      console.log('📸 Using alternative upload method via Supabase JS Client...');
      
      // Используем createClient напрямую (если доступно)
      const { createClient } = await import('@supabase/supabase-js');
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!;
      const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY!;
      
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      // Устанавливаем токен аутентификации
      const token = localStorage.getItem('auth_token');
      if (token) {
        supabase.auth.setSession({
          access_token: token,
          refresh_token: localStorage.getItem('refresh_token') || ''
        });
      }
      
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${uuidv4()}.${ext}`;
      const filePath = `${fileName}`;

      console.log('📂 Alternative upload path:', `avatars/${filePath}`);
      
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) {
        throw new Error(`Alternative upload failed: ${error.message}`);
      }
      
      // Получаем публичный URL
      const { data: publicData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      console.log('✅ Alternative upload successful!');
      console.log('📸 Public URL:', publicData.publicUrl);
      
      return publicData.publicUrl;
    } catch (error: any) {
      console.error('❌ Alternative upload method failed:', error);
      throw error;
    }
  }

  /**
   * Валидация файла перед загрузкой
   * @private
   * @param {File} file - Файл для валидации
   * @throws {Error} Ошибка валидации
   */
  private validateUploadFile(file: File): void {
    console.log('🔍 Validating upload file...');
    
    // Проверка размера файла (максимум 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error(`File too large. Maximum size allowed is ${(maxSize / (1024 * 1024))}MB, but got ${(file.size / (1024 * 1024)).toFixed(2)}MB.`);
    }
    
    // Проверка минимального размера (минимум 1KB)
    const minSize = 1024; // 1KB
    if (file.size < minSize) {
      throw new Error('File too small. Please choose a valid image file.');
    }
    
    // Проверка типа файла
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      throw new Error(`Invalid file type. Allowed types: ${allowedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')}.`);
    }
    
    // Проверка расширения файла (дополнительная защита)
    const fileName = file.name.toLowerCase();
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
    
    if (!hasValidExtension) {
      throw new Error(`Invalid file extension. Allowed extensions: ${allowedExtensions.join(', ')}.`);
    }
    
    console.log('✅ File validation passed:', {
      name: file.name,
      type: file.type,
      size: `${(file.size / (1024 * 1024)).toFixed(2)}MB`
    });
  }
  /**
   * Регистрация нового пользователя
   * @param {SignUpFormData} data - Данные для регистрации
   * @returns {Promise<AuthResult>} Результат регистрации с пользователем и токеном
   * @throws {ApiError} Ошибка регистрации
   * 
   * @example
   * const result = await authAPI.signUp({
   *   email: 'user@example.com',
   *   password: 'securePassword123',
   *   fullName: 'John Doe',
   *   organizationName: 'Sport Club',
   *   agreeToTerms: true
   * });
   */
  async signUp(data: SignUpFormData): Promise<AuthResult> {
    try {
      console.log('🚀 Starting signUp process...');
      console.log('📧 Email for registration:', data.email);
      
      // 1. Определяем роль: если есть организация - организатор, иначе - пользователь
      const role = data.organizationName ? UserRole.ORGANIZER : UserRole.USER;
      console.log(`👤 User role determined: ${role}`);

      // 2. Проверяем существование пользователя в Supabase Auth (только быстрая проверка)
      console.log('🔍 Checking if user already exists in Auth...');
      try {
        const { data: existingAuthUser } = await authClient.get('/user');
        if (existingAuthUser?.user) {
          console.log('⚠️ User already logged in to Auth');
          throw new Error('You are already logged in. Please sign out first.');
        }
      } catch (error: any) {
        if (error.response?.status === 401) {
          console.log('✅ No current auth user found - good for signup');
        } else {
          console.error('❌ Error checking existing auth user:', error);
        }
      }

      console.log('ℹ️  Примечание: проверка user_profiles не нужна, так как триггер handle_new_user создаст базовую запись автоматически');

      // 3. Подготавливаем метаданные пользователя для GoTrue
      console.log('📝 Preparing user metadata...');
      const userMetadata = {
        fullName: data.fullName,
        phone: data.phone, // Теперь phone в метаданных
        address: data.address,
        organizationName: data.organizationName,
        organizationAddress: data.organizationAddress,
        organizationNumber: data.organizationNumber,
        role: role
      };
      console.log('📋 User metadata prepared:', userMetadata);

      // 4. Отправляем запрос на регистрацию (ТОЛЬКО email, без phone)
      const response: AxiosResponse<AuthResponse> = await authClient.post('/signup', {
        email: data.email,
        password: data.password,
        data: userMetadata // phone теперь в метаданных
      });

      // Валидация ответа
      if (!response.data) {
        throw new Error('signUp: empty response from auth server');
      }

      if (!response.data.user) {
        throw new Error('signUp: user data missing from response');
      }

      console.log('✅ Supabase Auth signup successful!');
      console.log('📊 Registration response details:', {
        has_access_token: !!response.data.access_token,
        has_user: !!response.data.user,
        user_id: response.data.user?.id,
        user_email: response.data.user?.email,
        token_length: response.data.access_token?.length || 0
      });

      // Supabase может не возвращать токен сразу при регистрации (если требует подтверждение email)
      if (!response.data.access_token) {
        console.warn('signUp: access token missing - user may need email confirmation');
        // Не блокируем регистрацию, токен может появиться после подтверждения email
      }

      // 5. Сохраняем токен, чтобы последующие запросы были аутентифицированы
      if (response.data.access_token) {
        setAuthToken(response.data.access_token);
      } else {
        console.warn('No access token received - API requests may fail until email is confirmed');
      }

      // 6. Обновляем профиль в таблице user_profiles (триггер handle_new_user уже создал базовую запись)
      const userId = response.data.user.id;
      console.log('👤 Updating user profile with ID:', userId);
      console.log('ℹ️  Триггер handle_new_user уже создал базовую запись (id, email), обновляем остальные поля');
      
      const profileUpdateData = {
        // НЕ включаем id и email - они уже созданы триггером handle_new_user
        full_name: data.fullName,
        phone: data.phone,
        address: data.address,
        organization_name: data.organizationName,
        organization_address: data.organizationAddress,
        organization_number: data.organizationNumber,
        role: role,
        isApproved: false // New users need approval
        // created_at, updated_at автоматически добавляются БД
      };
      console.log('📋 Profile update data prepared:', profileUpdateData);
      console.log('🔧 Role being sent to DB:', {
        original_role: role,
        role_in_updateData: profileUpdateData.role,
        typeof_role: typeof profileUpdateData.role
      });

      try {
        // Обновляем профиль только если есть токен
        if (response.data.access_token) {
          console.log('💾 Updating user profile in database...');
          const updateResult = await apiClient.patch(`/user_profiles?id=eq.${userId}`, profileUpdateData);
          console.log('✅ User profile updated successfully in user_profiles table:', updateResult.data);
        } else {
          console.warn('⚠️ Skipping user_profiles update - no access token available');
          throw new Error('Registration failed: No access token received. Please check your email to confirm your account.');
        }
      } catch (profileError: any) {
        console.error('❌ Failed to update user profile');
        console.error('🔍 Error details:', {
          status: profileError?.response?.status,
          statusText: profileError?.response?.statusText,
          data: profileError?.response?.data,
          message: profileError?.message,
          config: profileError?.config ? {
            method: profileError.config.method,
            url: profileError.config.url,
            data: profileError.config.data
          } : null
        });
        
        // Для PATCH запросов 409 конфликт маловероятен, но обрабатываем на всякий случай
        if (profileError?.response?.status === 409 || profileError?.status === 409) {
          console.error('⚠️ 409 Conflict during profile update (unexpected)');
          console.log('📊 Profile update conflict details:', {
            attempted_email: data.email,
            attempted_user_id: userId,
            error_message: profileError?.response?.data?.message || profileError?.message
          });
        }
        
        // Для других ошибок профиля - тоже удаляем пользователя
        try {
          console.log('🗑️ Profile update failed, deleting user from auth...');
          await authClient.delete(`/admin/users/${userId}`);
          console.log('✅ User deleted from auth due to profile update failure');
        } catch (deleteError) {
          console.error('❌ Failed to delete user from auth:', deleteError);
        }
        
        // Очищаем токен и localStorage при любой ошибке профиля
        removeAuthToken();
        localStorage.removeItem('auth_token');
        console.log('🧹 Cleared auth token and localStorage');
        
        throw new Error(`Registration failed: Unable to update user profile. ${profileError.message || 'Please try again.'}`);
      }

      // 7. Получаем обновленный профиль из user_profiles (только если есть токен)
      let user: User;
      
      if (response.data.access_token) {
        try {
          const updatedProfileResponse = await apiClient.get(`/user_profiles?id=eq.${userId}&select=*`);
          console.log('signUp updatedProfileResponse: (получили обновленный профиль из user_profiles)', updatedProfileResponse);
          if (updatedProfileResponse.data && updatedProfileResponse.data.length > 0) {
            user = transformUserProfile(updatedProfileResponse.data[0]);
          } else {
            console.warn('Profile not found in user_profiles, using auth data as fallback');
            user = transformSupabaseUser(response.data.user);
          }
        } catch (profileFetchError) {
          console.error('Failed to fetch updated profile:', profileFetchError);
          console.warn('Using auth data as fallback');
          user = transformSupabaseUser(response.data.user);
        }
      } else {
        // Нет токена - используем данные из auth
        console.warn('No access token - using auth data only');
        
        // Валидация перед трансформацией
        if (!response.data.user) {
          throw new Error('signUp: user data is missing from auth response');
        }
        
        try {
          user = transformSupabaseUser(response.data.user);
        } catch (transformError: any) {
          console.error('signUp: Failed to transform user data:', transformError);
          throw new Error(`Регистрация завершена, но не удалось обработать данные пользователя: ${transformError.message || transformError}`);
        }
      }

      // 8. Если есть фото, загружаем его и обновляем профиль
      if (data.photo) {
        try {
          console.log('📸 Starting photo upload...');
          const photoUrl = await this.uploadProfilePhoto(data.photo);
          // Обновляем профиль с URL фото (используем правильное поле avatar_url)
          console.log('💾 Updating user profile with photo URL...');
          
          // PATCH запрос напрямую в user_profiles с правильным полем avatar_url
          await apiClient.patch(`/user_profiles?id=eq.${userId}`, {
            avatar_url: photoUrl
          });
          
          console.log('✅ Profile updated with photo URL successfully');
          // Обновляем объект user с новым URL фото
          if (typeof user === 'object' && user !== null) {
            user.photoUrl = photoUrl; // В нашем интерфейсе User это поле называется photoUrl
          }
        } catch (uploadError: any) {
          console.error('❌ Photo upload failed:', uploadError);
          console.error('📋 Upload error details:', {
            message: uploadError.message,
            status: uploadError?.response?.status,
            data: uploadError?.response?.data
          });
          // Не прерываем регистрацию, если только загрузка фото не удалась
          console.warn('⚠️ User registration completed, but photo upload failed. User can upload photo later.');
        }
      }

      // 9. Возвращаем результат
      return {
        user: user,
        token: response.data.access_token || '' // Пустая строка если токена нет
      };
    } catch (error) {
      console.error('Ошибка регистрации:', error);
      // Очищаем токен, если регистрация в итоге не удалась
      removeAuthToken();
      throw error;
    }
  }

  /**
   * Загрузка фото профиля в хранилище
   * @private
   * @param {File} file - Файл изображения
   * @returns {Promise<string>} URL загруженного изображения
   */
  private async uploadProfilePhoto(file: File): Promise<string> {
    try {
      console.log('📸 Starting photo upload process...');
      console.log('📋 Upload details:', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        sizeInMB: (file.size / (1024 * 1024)).toFixed(2)
      });

      // Валидация файла
      this.validateUploadFile(file);
      
      // Пробуем сначала альтернативный метод
      try {
        console.log('🔄 Trying alternative upload method first...');
        const alternativeUrl = await this.uploadProfilePhotoAlternative(file);
        return alternativeUrl;
      } catch (alternativeError: any) {
        console.warn('⚠️ Alternative upload failed, trying REST API method...', alternativeError.message);
        // Продолжаем с оригинальным методом через REST API
      }

      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${uuidv4()}.${ext}`;
      const bucket = 'avatars';
      const filePath = `${fileName}`;

      console.log('📂 Upload path:', `${bucket}/${filePath}`);

      // Проверяем наличие Supabase URL
      const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
      if (!supabaseUrl) {
        throw new Error('Supabase configuration is missing. Please contact support.');
      }

      const formData = new FormData();
      formData.append('file', file);

      // Получаем токен напрямую из localStorage для гарантии
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Authentication required for file upload. Please sign in again.');
      }

      console.log('🔑 Token available for upload:', !!token);
      console.log('🔍 Token details for debugging:', {
        tokenLength: token.length,
        tokenStart: token.substring(0, 20) + '...',
        bucket: bucket,
        filePath: filePath,
        supabaseUrl: supabaseUrl
      });
      console.log('⬆️ Uploading file to Supabase Storage...');

      const uploadResponse = await storageClient.post(
        `/object/${bucket}/${filePath}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          },
          timeout: 30000 // 30 second timeout for uploads
        }
      );

      console.log('✅ Upload response:', {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        data: uploadResponse.data
      });

      // Проверяем успешность загрузки
      if (uploadResponse.status !== 200) {
        throw new Error(`Upload failed with status ${uploadResponse.status}: ${uploadResponse.statusText}`);
      }

      // Возвращаем публичный URL (правильный способ для Supabase)
      const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucket}/${filePath}`;
      console.log('🎉 Photo uploaded successfully!');
      console.log('📸 Public URL:', publicUrl);
      
      return publicUrl;
    } catch (error: any) {
      console.error('❌ Photo upload failed');
      console.error('🔍 Upload error details:', {
        message: error.message,
        code: error.code,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
        data: error?.response?.data,
        url: error?.config?.url,
        method: error?.config?.method,
        timeout: error.code === 'ECONNABORTED',
        headers: error?.config?.headers,
        responseHeaders: error?.response?.headers
      });
      
      // Особая обработка RLS ошибок
      if (error?.response?.data && typeof error.response.data === 'object') {
        console.error('🔐 RLS/Storage specific error:', {
          errorCode: error.response.data.error_code,
          errorDescription: error.response.data.error_description,
          message: error.response.data.message,
          hint: error.response.data.hint,
          details: error.response.data.details
        });
      }
      
      // Обработка различных типов ошибок
      if (error.code === 'ECONNABORTED') {
        throw new Error('Upload timeout. Please check your internet connection and try again.');
      } else if (error?.response?.status === 400) {
        // Особая обработка RLS ошибок
        const errorData = error.response.data;
        if (errorData?.message?.includes('row-level security') || errorData?.message?.includes('violates row-level security policy')) {
          throw new Error('Storage permission denied. Please contact support - the file storage is not properly configured.');
        } else if (errorData?.message?.includes('bucket')) {
          throw new Error('Storage bucket not found or not accessible. Please contact support.');
        } else {
          throw new Error(`Upload failed: ${errorData?.message || 'Bad request'}. Please try a different image.`);
        }
      } else if (error?.response?.status === 401) {
        throw new Error('Authentication expired. Please sign in again and try uploading the photo.');
      } else if (error?.response?.status === 403) {
        throw new Error('Access denied. You do not have permission to upload files. Please contact support.');
      } else if (error?.response?.status === 404) {
        throw new Error('Upload service not found. The storage bucket may not exist. Please contact support.');
      } else if (error?.response?.status === 409) {
        throw new Error('File already exists. Please try again or choose a different file.');
      } else if (error?.response?.status === 413) {
        throw new Error('File is too large. Please choose an image smaller than 5MB.');
      } else if (error?.response?.status === 415) {
        throw new Error('File type not supported. Please choose a JPG, PNG, or WebP image.');
      } else if (error?.response?.status === 422) {
        throw new Error('Invalid file format. Please choose a valid image file.');
      } else if (error?.response?.status === 429) {
        throw new Error('Too many upload attempts. Please wait a moment and try again.');
      } else if (error?.response?.status >= 500) {
        throw new Error('Server error during upload. Please try again later.');
      } else if (error.message?.includes('Network Error')) {
        throw new Error('Network connection error. Please check your internet and try again.');
      } else {
        // Последняя попытка - пробуем альтернативный метод если REST API не сработал
        if (error?.response?.status === 400) {
          try {
            console.log('🔄 REST API failed with 400, trying alternative method as last resort...');
            const alternativeUrl = await this.uploadProfilePhotoAlternative(file);
            console.log('✅ Alternative method succeeded after REST API failure!');
            return alternativeUrl;
          } catch (alternativeError: any) {
            console.error('❌ Both upload methods failed');
            throw new Error(`Photo upload failed: ${error.message || 'Unknown error'}. Please try again.`);
          }
        }
        
        throw new Error(`Photo upload failed: ${error.message || 'Unknown error'}. Please try again.`);
      }
    }
  }

  /**
   * Вход пользователя в систему
   * @param {SignInFormData} data - Данные для входа
   * @returns {Promise<AuthResult>} Результат входа с пользователем и токеном
   * @throws {ApiError} Ошибка входа
   * 
   * @example
   * const result = await authAPI.signIn({
   *   email: 'user@example.com',
   *   password: 'securePassword123',
   *   rememberMe: true
   * });
   */
  async signIn(data: SignInFormData): Promise<AuthResult> {
    try {
      console.log('🚀 Starting signIn process for:', data.email);

      // Отправляем запрос на вход
      const response: AxiosResponse<AuthResponse> = await authClient.post('/token?grant_type=password', {
        email: data.email,
        password: data.password
      });

      console.log('✅ Auth response received:', {
        status: response.status,
        hasToken: !!response.data?.access_token,
        hasUser: !!response.data?.user,
        userId: response.data?.user?.id
      });

      // Валидация ответа
      if (!response.data) {
        throw new Error('signIn: empty response from auth server');
      }

      if (!response.data.access_token) {
        throw new Error('signIn: access token missing from response');
      }

      if (!response.data.user) {
        throw new Error('signIn: user data missing from response');
      }

      // Сохраняем токен
      if (response.data.access_token) {
        setAuthToken(response.data.access_token);

        // Если "Запомнить меня" - сохраняем refresh token
        if (data.rememberMe && response.data.refresh_token) {
          localStorage.setItem('refresh_token', response.data.refresh_token);
        }
      }

      // Получаем профиль пользователя из user_profiles
      const userId = response.data.user.id;
      console.log('🔍 Fetching user profile for ID:', userId);

      try {
        const profileResponse = await apiClient.get(`/user_profiles?id=eq.${userId}&select=*`);

        console.log('📊 Profile response:', {
          status: profileResponse.status,
          dataLength: profileResponse.data?.length || 0,
          hasProfile: profileResponse.data?.length > 0
        });

        if (!profileResponse.data || profileResponse.data.length === 0) {
          console.warn('⚠️ Profile not found in user_profiles, creating fallback user');
          // Fallback to auth user data if profile doesn't exist
          return {
            user: transformSupabaseUser(response.data.user),
            token: response.data.access_token
          };
        }

        // Возвращаем результат с пользователем из user_profiles
        return {
          user: transformUserProfile(profileResponse.data[0]),
          token: response.data.access_token
        };
      } catch (profileError: any) {
        console.error('❌ Failed to fetch user profile:', profileError);
        console.warn('⚠️ Using auth data as fallback');

        // Fallback to auth user data
        return {
          user: transformSupabaseUser(response.data.user),
          token: response.data.access_token
        };
      }
    } catch (error: any) {
      console.error('❌ SignIn error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });

      // Clear any partial auth state on error
      removeAuthToken();
      localStorage.removeItem('refresh_token');

      throw error;
    }
  }

  /**
   * Выход пользователя из системы
   * @returns {Promise<void>}
   * @throws {ApiError} Ошибка выхода
   * 
   * @example
   * await authAPI.signOut();
   */
  async signOut(): Promise<void> {
    try {
      // Отправляем запрос на выход
      await authClient.post('/logout');
      
      // Удаляем токены
      removeAuthToken();
      localStorage.removeItem('refresh_token');
    } catch (error) {
      console.error('Ошибка выхода:', error);
      // Даже если запрос не удался, очищаем локальные токены
      removeAuthToken();
      localStorage.removeItem('refresh_token');
      throw error;
    }
  }

  /**
   * Получение текущего пользователя
   * @returns {Promise<User>} Текущий пользователь
   * @throws {ApiError} Ошибка получения пользователя
   * 
   * @example
   * const currentUser = await authAPI.getCurrentUser();
   */
  async getCurrentUser(): Promise<User> {
    try {
      // Проверяем наличие токена перед запросом
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('Токен аутентификации не найден');
      }

      // Получаем базовые данные пользователя из auth
      const authResponse: AxiosResponse<any> = await authClient.get('/user');
      
      console.log('Auth response status:', authResponse.status);
      console.log('Auth response data:', authResponse.data);
      
      // Валидация структуры ответа
      if (!authResponse.data) {
        throw new Error('Пустой ответ от сервера аутентификации');
      }

      // Support both response shapes from Supabase (/auth/v1/user):
      // - Root object with user fields
      // - { user: { ... } }
      if (false && !authResponse.data.user) {
        throw new Error('Данные пользователя отсутствуют в ответе сервера');
      }

      const authUser: SupabaseUser | undefined = (authResponse.data as any).user ?? authResponse.data;
      if (!authUser) {
        throw new Error('D"D�D�D��<D� D�D_D��OD�D_D�D��,D�D��? D_�,�?���,�?�,D����Z�, D� D_�,D�D�,D� �?D�?D�D�?D�');
      }
      
      // Дополнительная валидация данных пользователя
      if (!authUser.id || !authUser.email) {
        throw new Error('Некорректные данные пользователя: отсутствует id или email');
      }

      const userId = authUser.id;
      console.log('Fetching profile for user ID:', userId);
      
      // ГЛАВНЫЙ ИСТОЧНИК ДАННЫХ - таблица user_profiles
      const profileResponse = await apiClient.get(`/user_profiles?id=eq.${userId}&select=*`);
      
      console.log('Profile response status:', profileResponse.status);
      console.log('Profile response data:', profileResponse.data);
      
      if (!profileResponse.data || profileResponse.data.length === 0) {
        console.warn(`Профиль пользователя не найден в user_profiles для ID: ${userId}. Используем данные из auth.`);
        // Fallback to auth user data if profile doesn't exist yet
        try {
          return transformSupabaseUser(authUser);
        } catch (transformError: any) {
          console.error('Ошибка трансформации данных пользователя:', transformError);
          throw new Error(`Не удалось обработать данные пользователя: ${transformError.message || transformError}`);
        }
      }
      
      const profile = profileResponse.data[0];
      
      // Используем новую функцию преобразования из user_profiles
      return transformUserProfile(profile);
      
    } catch (error: any) {
      console.error('Ошибка получения текущего пользователя:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      // Очищаем токены только в случае ошибок аутентификации
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('Очищаем токены из-за ошибки аутентификации');
        removeAuthToken();
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
      }
      
      throw error;
    }
  }

  /**
   * Обновление профиля пользователя
   * @param {Partial<User>} data - Данные для обновления
   * @returns {Promise<User>} Обновленный пользователь
   * @throws {ApiError} Ошибка обновления профиля
   * 
   * @example
   * const updatedUser = await authAPI.updateProfile({
   *   fullName: 'Jane Doe',
   *   phone: '+1234567890'
   * });
   */
  async updateProfile(data: Partial<User> & { photo?: File }): Promise<User> {
    try {
      console.log('🚀 Starting updateProfile with data:', data);

      // Проверяем наличие токена перед запросом
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('updateProfile: authentication token not found');
      }

      // Получаем текущего пользователя для ID
      const currentUserResponse = await authClient.get('/user');
      const currentAuthUser: SupabaseUser | undefined = (currentUserResponse.data as any).user ?? currentUserResponse.data;
      if (!currentAuthUser?.id) {
        throw new Error('updateProfile: unable to get current user ID');
      }

      const userId = currentAuthUser.id;
      console.log('📋 Updating profile for user ID:', userId);

      // Подготавливаем данные для обновления в user_profiles
      const profileUpdateData: any = {};

      // Optional: upload new photo if provided
      if ((data as any).photo instanceof File) {
        try {
          const newUrl = await this.uploadProfilePhoto((data as any).photo as File);
          profileUpdateData.avatar_url = newUrl;
        } catch (uploadErr) {
          console.error('updateProfile: photo upload failed', uploadErr);
          throw uploadErr;
        }
      }

      // Маппинг полей из нашего интерфейса User в поля БД
      if (data.fullName !== undefined) profileUpdateData.full_name = data.fullName;
      if (data.phone !== undefined) profileUpdateData.phone = data.phone;
      if (data.address !== undefined) profileUpdateData.address = data.address;
      if (data.organizationName !== undefined) profileUpdateData.organization_name = data.organizationName;
      if (data.organizationAddress !== undefined) profileUpdateData.organization_address = data.organizationAddress;
      if (data.organizationNumber !== undefined) profileUpdateData.organization_number = data.organizationNumber;
      if (data.role !== undefined) profileUpdateData.role = data.role;
      if (data.photoUrl !== undefined) profileUpdateData.avatar_url = data.photoUrl; // БД поле

      console.log('💾 Profile update data:', profileUpdateData);

      // Обновляем профиль в user_profiles напрямую
      const updateResult = await apiClient.patch(`/user_profiles?id=eq.${userId}`, profileUpdateData);

      console.log('✅ Profile update result:', {
        status: updateResult.status,
        statusText: updateResult.statusText
      });

      // Получаем обновленный профиль
      console.log('🔍 Fetching updated profile...');
      const updatedProfileResponse = await apiClient.get(`/user_profiles?id=eq.${userId}&select=*`);

      if (!updatedProfileResponse.data || updatedProfileResponse.data.length === 0) {
        throw new Error('updateProfile: unable to fetch updated profile');
      }

      console.log('📊 Updated profile data:', updatedProfileResponse.data[0]);

      // Возвращаем обновленный профиль
      return transformUserProfile(updatedProfileResponse.data[0]);

    } catch (error: any) {
      console.error('❌ Profile update error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: error.config ? {
          method: error.config.method,
          url: error.config.url,
          data: error.config.data
        } : null
      });
      throw error;
    }
  }

  /**
   * Сброс пароля (для восстановления через email)
   * @param {string} newPassword - Новый пароль
   * @returns {Promise<void>}
   * @throws {ApiError} Ошибка сброса пароля
   * 
   * @example
   * await authAPI.resetPassword('newSecurePassword123');
   */
  async resetPassword(newPassword: string): Promise<void> {
    try {
      // Отправляем запрос на сброс пароля
      await authClient.put('/user', {
        password: newPassword
      });
    } catch (error) {
      console.error('Ошибка сброса пароля:', error);
      throw error;
    }
  }

  /**
   * Запрос на сброс пароля
   * @param {string} email - Email для сброса пароля
   * @returns {Promise<void>}
   * @throws {ApiError} Ошибка запроса сброса пароля
   * 
   * @example
   * await authAPI.requestPasswordReset('user@example.com');
   */
  async requestPasswordReset(email: string): Promise<void> {
    try {
      // Отправляем запрос на сброс пароля
      await authClient.post('/recover', {
        email: email
      });
    } catch (error) {
      console.error('Ошибка запроса сброса пароля:', error);
      throw error;
    }
  }

  /**
   * Подтверждение email адреса
   * @param {string} token - Токен подтверждения
   * @returns {Promise<User>} Пользователь с подтвержденным email
   * @throws {ApiError} Ошибка подтверждения email
   * 
   * @example
   * const user = await authAPI.verifyEmail('verification-token');
   */
  async verifyEmail(token: string): Promise<User> {
    try {
      // Отправляем запрос на подтверждение email
      const response: AxiosResponse<AuthResponse> = await authClient.post('/verify', {
        type: 'signup',
        token: token
      });

      // Сохраняем токен
      if (response.data.access_token) {
        setAuthToken(response.data.access_token);
      }

      // Получаем профиль пользователя из user_profiles
      const userId = response.data.user.id;
      const profileResponse = await apiClient.get(`/user_profiles?id=eq.${userId}&select=*`);
      
      if (!profileResponse.data || profileResponse.data.length === 0) {
        throw new Error('Профиль пользователя не найден после подтверждения email');
      }

      return transformUserProfile(profileResponse.data[0]);
    } catch (error) {
      console.error('Ошибка подтверждения email:', error);
      throw error;
    }
  }

  /**
   * Обновление токена с помощью refresh token
   * @returns {Promise<string>} Новый access token
   * @throws {ApiError} Ошибка обновления токена
   * 
   * @example
   * const newToken = await authAPI.refreshToken();
   */
  async refreshToken(): Promise<string> {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      
      if (!refreshToken) {
        throw new Error('Refresh token не найден');
      }

      // Отправляем запрос на обновление токена
      const response: AxiosResponse<AuthResponse> = await authClient.post('/token?grant_type=refresh_token', {
        refresh_token: refreshToken
      });

      // Сохраняем новый токен
      if (response.data.access_token) {
        setAuthToken(response.data.access_token);
        
        // Обновляем refresh token если он пришел
        if (response.data.refresh_token) {
          localStorage.setItem('refresh_token', response.data.refresh_token);
        }
      }

      return response.data.access_token;
    } catch (error) {
      console.error('Ошибка обновления токена:', error);
      // При ошибке обновления токена выходим из системы
      removeAuthToken();
      localStorage.removeItem('refresh_token');
      throw error;
    }
  }

  /**
   * Проверка валидности текущей сессии
   * @returns {Promise<boolean>} true если сессия валидна
   * 
   * @example
   * const isValid = await authAPI.isSessionValid();
   */
  async isSessionValid(): Promise<boolean> {
    try {
      await this.getCurrentUser();
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Изменение пароля
   * @param {string} oldPassword - Текущий пароль
   * @param {string} newPassword - Новый пароль
   * @returns {Promise<void>}
   * 
   * @example
   * await authAPI.changePassword('oldpass123', 'newpass456');
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    try {
      await authClient.post('/user', {
        password: newPassword,
        data: {
          old_password: oldPassword
        }
      });
    } catch (error) {
      console.error('Ошибка смены пароля:', error);
      throw error;
    }
  }
}

// Создаем и экспортируем единственный экземпляр
const authAPI = new AuthAPI();

export default authAPI;
export { authAPI };
export type { AuthResult };
