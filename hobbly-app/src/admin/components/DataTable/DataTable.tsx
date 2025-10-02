/**
 * @fileoverview Универсальный компонент таблицы для админ-панели
 * @module admin/components/DataTable
 * @description Переиспользуемая таблица с поиском, пагинацией, actions и модальными окнами
 *
 * =============================================================================
 * ДОКУМЕНТАЦИЯ ПО ИСПОЛЬЗОВАНИЮ КОМПОНЕНТА DataTable
 * =============================================================================
 *
 * Этот компонент предоставляет полнофункциональную таблицу для отображения данных
 * с встроенной поддержкой поиска, пагинации, действий и обработки состояний.
 *
 * 📋 ОСНОВНЫЕ ВОЗМОЖНОСТИ:
 * ────────────────────────────────────────────────────────────────────────────
 * ✅ Отображение данных в табличном формате (HTML <table> или CSS Grid)
 * ✅ Настраиваемые колонки с кастомным рендерингом
 * ✅ Поиск с debounce (задержкой) для оптимизации
 * ✅ Пагинация с настраиваемым количеством элементов
 * ✅ Действия для каждой строки (Edit, Delete, Approve и т.д.)
 * ✅ Состояния загрузки, ошибок и пустого списка
 * ✅ Модальные окна подтверждения (опционально)
 * ✅ Responsive дизайн с CSS Modules
 *
 *
 * 📦 ПРИМЕР БАЗОВОГО ИСПОЛЬЗОВАНИЯ:
 * ────────────────────────────────────────────────────────────────────────────
 *
 * import DataTable, { ColumnConfig, ActionConfig } from './DataTable';
 * import { Activity } from '../../../types';
 *
 * const MyPage: React.FC = () => {
 *   const [activities, setActivities] = useState<Activity[]>([]);
 *   const [total, setTotal] = useState(0);
 *   const [loading, setLoading] = useState(false);
 *   const [currentPage, setCurrentPage] = useState(1);
 *
 *   // Определяем конфигурацию колонок
 *   const columns: ColumnConfig<Activity>[] = [
 *     {
 *       key: 'title',
 *       header: 'Activity Name',
 *       render: (activity) => <strong>{activity.title}</strong>
 *     },
 *     {
 *       key: 'location',
 *       header: 'Location',
 *       render: (activity) => activity.location
 *     }
 *   ];
 *
 *   // Определяем действия
 *   const actions: ActionConfig<Activity>[] = [
 *     {
 *       icon: '✏️',
 *       title: 'Edit',
 *       variant: 'edit',
 *       onClick: (activity) => navigate(`/edit/${activity.id}`)
 *     },
 *     {
 *       icon: '🗑️',
 *       title: 'Delete',
 *       variant: 'delete',
 *       onClick: (activity) => handleDelete(activity.id)
 *     }
 *   ];
 *
 *   return (
 *     <DataTable
 *       data={activities}
 *       totalItems={total}
 *       loading={loading}
 *       columns={columns}
 *       actions={actions}
 *       rowKey="id"
 *       searchable
 *       searchPlaceholder="Search activities..."
 *       onSearch={loadActivities}
 *       currentPage={currentPage}
 *       itemsPerPage={10}
 *       onPageChange={setCurrentPage}
 *     />
 *   );
 * };
 *
 *
 * 📚 ДЕТАЛЬНОЕ ОПИСАНИЕ ПАРАМЕТРОВ:
 * ────────────────────────────────────────────────────────────────────────────
 * См. интерфейсы ниже с подробными комментариями для каждого параметра
 */

import React, { useState, useEffect, useMemo } from 'react';
import styles from './DataTable.module.css';

// ============================================================================
// TypeScript Interfaces
// ============================================================================

/**
 * Конфигурация колонки таблицы
 *
 * @example
 * const columns: ColumnConfig<Activity>[] = [
 *   {
 *     key: 'name',
 *     header: 'Activity Name',
 *     width: '300px',
 *     align: 'left',
 *     render: (activity, index) => (
 *       <div>
 *         <strong>{activity.title}</strong>
 *         <span>{activity.category}</span>
 *       </div>
 *     )
 *   }
 * ];
 */
export interface ColumnConfig<T> {
  /**
   * Уникальный ключ колонки
   *
   * Используется в качестве React key при рендеринге.
   * Должен быть уникальным среди всех колонок.
   *
   * @example 'title' | 'location' | 'price'
   */
  key: string;

  /**
   * Заголовок колонки
   *
   * Текст, отображаемый в шапке таблицы.
   * Поддерживает любую строку.
   *
   * @example 'Activity Name' | 'Organisator' | 'Date'
   */
  header: string;

  /**
   * Ширина колонки (опционально)
   *
   * CSS значение ширины. Если не указано, ширина рассчитывается автоматически.
   *
   * @example '200px' | '20%' | 'auto' | '1fr'
   * @default undefined (автоматическая ширина)
   */
  width?: string;

  /**
   * Функция рендеринга содержимого ячейки
   *
   * Принимает элемент данных и его индекс, возвращает React элемент.
   * Вызывается для каждой строки в таблице.
   *
   * @param item - Объект данных текущей строки
   * @param index - Индекс строки в массиве (0-based)
   * @returns React элемент для отображения в ячейке
   *
   * @example
   * render: (activity, index) => (
   *   <div>
   *     <img src={activity.imageUrl} alt={activity.title} />
   *     <span>{activity.title}</span>
   *   </div>
   * )
   */
  render: (item: T, index: number) => React.ReactNode;

  /**
   * Выравнивание содержимого ячейки (опционально)
   *
   * Определяет горизонтальное выравнивание текста в ячейке.
   *
   * @example 'left' | 'center' | 'right'
   * @default 'left'
   */
  align?: 'left' | 'center' | 'right';
}

/**
 * Конфигурация кнопки действия
 *
 * Определяет действие, которое можно выполнить для каждой строки таблицы.
 * Кнопки отображаются в отдельной колонке "Actions".
 *
 * @example
 * const actions: ActionConfig<Activity>[] = [
 *   {
 *     icon: '✏️',
 *     title: 'Edit activity',
 *     variant: 'edit',
 *     onClick: (activity) => navigate(`/edit/${activity.id}`)
 *   },
 *   {
 *     icon: '🗑️',
 *     title: 'Delete activity',
 *     variant: 'delete',
 *     onClick: (activity) => handleDelete(activity.id),
 *     disabled: (activity) => activity.userId !== currentUser.id
 *   }
 * ];
 */
export interface ActionConfig<T> {
  /**
   * Иконка кнопки
   *
   * Может быть эмодзи (строка) или React элемент (SVG, компонент).
   * Отображается внутри кнопки действия.
   *
   * @example '✏️' | '🗑️' | <EditIcon /> | <DeleteIcon />
   */
  icon: string | React.ReactNode;

  /**
   * Подсказка при наведении
   *
   * Текст, отображаемый в атрибуте title при наведении курсора.
   * Используется для accessibility и UX.
   *
   * @example 'Edit activity' | 'Delete permanently' | 'Approve request'
   */
  title: string;

  /**
   * Обработчик клика по кнопке
   *
   * Функция, вызываемая при клике на кнопку действия.
   * Получает объект данных текущей строки.
   *
   * @param item - Объект данных строки, для которой нажата кнопка
   *
   * @example
   * onClick: (activity) => {
   *   console.log('Editing activity:', activity.id);
   *   navigate(`/edit/${activity.id}`);
   * }
   */
  onClick: (item: T) => void;

  /**
   * Условие отключения кнопки (опционально)
   *
   * Функция, определяющая, должна ли кнопка быть отключена для конкретной строки.
   * Если возвращает true, кнопка становится неактивной (disabled).
   *
   * @param item - Объект данных строки
   * @returns true если кнопка должна быть отключена, иначе false
   *
   * @example
   * disabled: (activity) => activity.userId !== currentUser.id
   * disabled: (user) => user.role === 'admin'
   *
   * @default undefined (кнопка всегда активна)
   */
  disabled?: (item: T) => boolean;

  /**
   * Вариант стиля кнопки (опционально)
   *
   * Определяет визуальный стиль кнопки (цвет, иконку).
   * Каждый вариант имеет предопределенные CSS стили.
   *
   * Доступные варианты:
   * - 'edit': Синяя кнопка редактирования
   * - 'delete': Красная кнопка удаления
   * - 'approve': Зеленая кнопка одобрения
   * - 'reject': Оранжевая кнопка отклонения
   * - 'view': Серая кнопка просмотра
   * - 'restore': Зеленая кнопка восстановления
   * - 'permanent': Темно-красная кнопка окончательного удаления
   *
   * @example 'edit' | 'delete' | 'approve' | 'reject'
   * @default undefined (стандартный стиль)
   */
  variant?: 'edit' | 'delete' | 'approve' | 'reject' | 'view' | 'restore' | 'permanent';
}

/**
 * Конфигурация модального окна подтверждения
 *
 * Используется для отображения диалога подтверждения перед выполнением действия.
 * (В текущей версии не полностью реализовано, но интерфейс готов к использованию)
 *
 * @example
 * const confirmConfig: ConfirmConfig = {
 *   title: 'Delete Activity?',
 *   message: 'Are you sure you want to delete this activity? This action cannot be undone.',
 *   confirmText: 'Delete',
 *   confirmVariant: 'danger',
 *   cancelText: 'Cancel'
 * };
 */
export interface ConfirmConfig {
  /**
   * Заголовок модального окна
   *
   * @example 'Delete Activity?' | 'Confirm Approval' | 'Are you sure?'
   */
  title: string;

  /**
   * Текст сообщения в модальном окне
   *
   * @example 'This action cannot be undone.' | 'Do you want to proceed?'
   */
  message: string;

  /**
   * Текст кнопки подтверждения
   *
   * @example 'Delete' | 'Confirm' | 'Yes, proceed' | 'Approve'
   */
  confirmText: string;

  /**
   * Вариант стиля кнопки подтверждения (опционально)
   *
   * Определяет цвет кнопки подтверждения.
   * - 'danger': Красная (для удаления)
   * - 'success': Зеленая (для одобрения)
   * - 'primary': Синяя (для обычных действий)
   *
   * @example 'danger' | 'success' | 'primary'
   * @default 'primary'
   */
  confirmVariant?: 'danger' | 'success' | 'primary';

  /**
   * Текст кнопки отмены (опционально)
   *
   * @example 'Cancel' | 'No, go back' | 'Dismiss'
   * @default 'Cancel'
   */
  cancelText?: string;
}

/**
 * Пропсы компонента DataTable
 *
 * Полный список параметров для настройки компонента таблицы.
 * Все параметры разделены на логические группы для удобства.
 */
export interface DataTableProps<T> {
  // ==========================================================================
  // 📊 ДАННЫЕ (ОБЯЗАТЕЛЬНЫЕ)
  // ==========================================================================

  /**
   * Массив данных для отображения в таблице
   *
   * Основной источник данных для таблицы.
   * Каждый элемент массива представляет одну строку.
   *
   * @example
   * const data: Activity[] = [
   *   { id: '1', title: 'Yoga Class', location: 'Helsinki' },
   *   { id: '2', title: 'Swimming', location: 'Espoo' }
   * ];
   *
   * @required
   */
  data: T[];

  /**
   * Общее количество элементов (для расчета пагинации)
   *
   * Используется для отображения правильного количества страниц.
   * Обычно получается из API вместе с данными.
   *
   * ВАЖНО: Это общее количество элементов на сервере, а не в массиве data!
   *
   * @example
   * totalItems={250}  // Всего 250 активностей в базе
   * // При itemsPerPage=10 будет 25 страниц
   *
   * @required
   */
  totalItems: number;

  // ==========================================================================
  // ⚙️ СОСТОЯНИЯ (ОПЦИОНАЛЬНЫЕ)
  // ==========================================================================

  /**
   * Состояние загрузки данных
   *
   * Когда true:
   * - Если data пустой → показывается "Loading..."
   * - Если data есть → показывается overlay с индикатором загрузки
   *
   * @example
   * const [loading, setLoading] = useState(false);
   *
   * const loadData = async () => {
   *   setLoading(true);
   *   const response = await api.getActivities();
   *   setLoading(false);
   * };
   *
   * @default false
   */
  loading?: boolean;

  /**
   * Сообщение об ошибке
   *
   * Если передано (не null), таблица показывает состояние ошибки
   * вместо данных, с кнопкой "Retry" (если onRetry определен).
   *
   * @example
   * const [error, setError] = useState<string | null>(null);
   *
   * try {
   *   await api.getActivities();
   * } catch (err) {
   *   setError('Failed to load activities. Please try again.');
   * }
   *
   * @default null
   */
  error?: string | null;

  // ==========================================================================
  // 📋 КОЛОНКИ (ОБЯЗАТЕЛЬНЫЕ)
  // ==========================================================================

  /**
   * Конфигурация колонок таблицы
   *
   * Массив объектов ColumnConfig, определяющих структуру таблицы.
   * Каждый объект описывает одну колонку.
   *
   * @example
   * const columns: ColumnConfig<Activity>[] = [
   *   {
   *     key: 'name',
   *     header: 'Activity Name',
   *     render: (activity) => <strong>{activity.title}</strong>
   *   },
   *   {
   *     key: 'location',
   *     header: 'Location',
   *     width: '200px',
   *     render: (activity) => activity.location
   *   },
   *   {
   *     key: 'price',
   *     header: 'Price',
   *     align: 'right',
   *     render: (activity) => activity.price ? `${activity.price}€` : 'Free'
   *   }
   * ];
   *
   * @required
   */
  columns: ColumnConfig<T>[];

  /**
   * Ключ для уникальной идентификации строки
   *
   * Имя поля в объекте данных, которое содержит уникальный ID.
   * Используется как React key для оптимизации рендеринга.
   *
   * @example
   * rowKey="id"           // для { id: '123', ... }
   * rowKey="activityId"   // для { activityId: 'abc', ... }
   *
   * @required
   */
  rowKey: keyof T;

  // ==========================================================================
  // 🔍 ПОИСК (ОПЦИОНАЛЬНЫЙ)
  // ==========================================================================

  /**
   * Включить функцию поиска
   *
   * Если true, отображается поле поиска в header таблицы.
   *
   * @example
   * searchable={true}
   *
   * @default false
   */
  searchable?: boolean;

  /**
   * Placeholder для поля поиска
   *
   * Текст-подсказка в пустом поле поиска.
   * Отображается только если searchable=true.
   *
   * @example
   * searchPlaceholder="Search activities..."
   * searchPlaceholder="Search by name or location..."
   *
   * @default 'Search...'
   */
  searchPlaceholder?: string;

  /**
   * Начальное значение поля поиска
   *
   * Используется для предзаполнения поля поиска при монтировании.
   *
   * @example
   * searchValue="Helsinki"
   *
   * @default ''
   */
  searchValue?: string;

  /**
   * Обработчик изменения поискового запроса
   *
   * Вызывается с задержкой (debounce) после ввода пользователя.
   * Используйте для загрузки данных с сервера по поисковому запросу.
   *
   * ВАЖНО: Функция вызывается автоматически с задержкой searchDebounce!
   *
   * @param query - Текст поискового запроса
   *
   * @example
   * const loadActivities = async (searchQuery: string) => {
   *   setLoading(true);
   *   const response = await api.getActivities({ search: searchQuery });
   *   setData(response.data);
   *   setLoading(false);
   * };
   *
   * <DataTable
   *   searchable
   *   onSearch={loadActivities}
   *   searchDebounce={500}
   * />
   *
   * @default undefined
   */
  onSearch?: (query: string) => void;

  /**
   * Задержка debounce для поиска (в миллисекундах)
   *
   * Время ожидания после окончания ввода перед вызовом onSearch.
   * Предотвращает частые запросы к серверу при быстром вводе.
   *
   * @example
   * searchDebounce={300}   // 300ms задержка
   * searchDebounce={1000}  // 1 секунда задержка
   *
   * @default 500 (0.5 секунды)
   */
  searchDebounce?: number;

  // ==========================================================================
  // 📄 ПАГИНАЦИЯ (ОБЯЗАТЕЛЬНЫЕ)
  // ==========================================================================

  /**
   * Текущая страница (начинается с 1)
   *
   * Номер активной страницы.
   * ВАЖНО: Нумерация начинается с 1, а не с 0!
   *
   * @example
   * const [currentPage, setCurrentPage] = useState(1);
   * <DataTable currentPage={currentPage} onPageChange={setCurrentPage} />
   *
   * @required
   */
  currentPage: number;

  /**
   * Количество элементов на одной странице
   *
   * Сколько строк отображается на одной странице.
   * Используется для расчета totalPages.
   *
   * @example
   * itemsPerPage={10}   // 10 строк на странице
   * itemsPerPage={25}   // 25 строк на странице
   *
   * @required
   */
  itemsPerPage: number;

  /**
   * Обработчик изменения страницы
   *
   * Вызывается при клике на кнопки пагинации (Previous/Next/Page number).
   * Используйте для обновления состояния currentPage и загрузки новых данных.
   *
   * @param page - Новый номер страницы (1-indexed)
   *
   * @example
   * const [currentPage, setCurrentPage] = useState(1);
   *
   * const handlePageChange = (page: number) => {
   *   setCurrentPage(page);
   *   loadActivities(page); // загрузить данные для новой страницы
   * };
   *
   * <DataTable onPageChange={handlePageChange} />
   *
   * @required
   */
  onPageChange: (page: number) => void;

  /**
   * Скрыть пагинацию если только одна страница
   *
   * Если true, пагинация не отображается когда totalPages === 1.
   * Полезно для улучшения UX когда данных мало.
   *
   * @example
   * hidePaginationIfSingle={true}   // Скрыть для 1 страницы
   * hidePaginationIfSingle={false}  // Всегда показывать
   *
   * @default true
   */
  hidePaginationIfSingle?: boolean;

  // ==========================================================================
  // ⚡ ДЕЙСТВИЯ (ОПЦИОНАЛЬНЫЕ)
  // ==========================================================================

  /**
   * Массив действий для каждой строки
   *
   * Определяет кнопки действий, отображаемые в колонке "Actions".
   * Каждая кнопка применяется ко всем строкам таблицы.
   *
   * @example
   * const actions: ActionConfig<Activity>[] = [
   *   {
   *     icon: '✏️',
   *     title: 'Edit activity',
   *     variant: 'edit',
   *     onClick: (activity) => navigate(`/edit/${activity.id}`)
   *   },
   *   {
   *     icon: '🗑️',
   *     title: 'Delete activity',
   *     variant: 'delete',
   *     onClick: (activity) => handleDelete(activity.id),
   *     disabled: (activity) => activity.userId !== currentUser.id
   *   }
   * ];
   *
   * <DataTable actions={actions} />
   *
   * @default [] (нет действий)
   */
  actions?: ActionConfig<T>[];

  /**
   * Дополнительные элементы в header таблицы
   *
   * React элемент, отображаемый в правой части header (рядом с поиском).
   * Обычно используется для кнопки "Add" или других глобальных действий.
   *
   * @example
   * headerActions={
   *   <Link to="/admin/activities/new" className={styles.addButton}>
   *     Add Activity
   *   </Link>
   * }
   *
   * headerActions={
   *   <>
   *     <button onClick={handleExport}>Export CSV</button>
   *     <button onClick={handleImport}>Import</button>
   *   </>
   * }
   *
   * @default undefined
   */
  headerActions?: React.ReactNode;

  // ==========================================================================
  // 🎨 КАСТОМИЗАЦИЯ (ОПЦИОНАЛЬНЫЕ)
  // ==========================================================================

  /**
   * Сообщение при пустом списке данных
   *
   * Текст, отображаемый когда data.length === 0 и нет ошибки.
   *
   * @example
   * emptyMessage="No activities found"
   * emptyMessage="No users match your search"
   *
   * @default 'No items found'
   */
  emptyMessage?: string;

  /**
   * Дополнительный контент при пустом списке
   *
   * React элемент, отображаемый под emptyMessage.
   * Обычно используется для кнопки "Create" или иллюстрации.
   *
   * @example
   * emptyContent={
   *   <Link to="/admin/activities/new" className={styles.createButton}>
   *     Create your first activity
   *   </Link>
   * }
   *
   * emptyContent={
   *   <div className={styles.emptyIcon}>📭</div>
   * }
   *
   * @default undefined
   */
  emptyContent?: React.ReactNode;

  /**
   * Обработчик клика по строке таблицы
   *
   * Вызывается при клике на любую часть строки (кроме кнопок действий).
   * Используйте для навигации к детальной странице или открытия модального окна.
   *
   * @param item - Объект данных строки, по которой кликнули
   *
   * @example
   * onRowClick={(activity) => navigate(`/admin/activities/${activity.id}`)}
   * onRowClick={(user) => setSelectedUser(user)}
   *
   * @default undefined (строки не кликабельны)
   */
  onRowClick?: (item: T) => void;

  /**
   * Дополнительный CSS класс для контейнера
   *
   * Добавляется к корневому элементу таблицы для кастомных стилей.
   *
   * @example
   * className={styles.customTable}
   * className="my-custom-table"
   *
   * @default ''
   */
  className?: string;

  /**
   * Использовать CSS Grid вместо HTML <table>
   *
   * Если true, таблица рендерится с помощью CSS Grid (div элементы).
   * Если false, используется стандартный HTML <table>.
   *
   * Grid layout полезен для сложных layouts и лучшей адаптивности.
   *
   * @example
   * useGridLayout={true}   // Использовать CSS Grid
   * useGridLayout={false}  // Использовать <table>
   *
   * @default false
   */
  useGridLayout?: boolean;

  /**
   * Заголовок для колонки с actions
   *
   * Текст в шапке таблицы над кнопками действий.
   * Отображается только если actions.length > 0.
   *
   * @example
   * actionsHeader="Edit/Delete"
   * actionsHeader="Actions"
   * actionsHeader="Manage"
   *
   * @default 'Edit/Delete'
   */
  actionsHeader?: string;

  // ==========================================================================
  // 🔄 ОБРАБОТКА ОШИБОК (ОПЦИОНАЛЬНЫЕ)
  // ==========================================================================

  /**
   * Обработчик повтора при ошибке
   *
   * Функция, вызываемая при клике на кнопку "Retry" в состоянии ошибки.
   * Используйте для повторной загрузки данных после сбоя.
   *
   * @example
   * const loadActivities = async () => {
   *   try {
   *     setError(null);
   *     setLoading(true);
   *     const response = await api.getActivities();
   *     setData(response.data);
   *   } catch (err) {
   *     setError('Failed to load activities');
   *   } finally {
   *     setLoading(false);
   *   }
   * };
   *
   * <DataTable
   *   error={error}
   *   onRetry={loadActivities}
   * />
   *
   * @default undefined (кнопка "Retry" не отображается)
   */
  onRetry?: () => void;
}

// ============================================================================
// DataTable Component
// ============================================================================

/**
 * Универсальный компонент таблицы с поиском, пагинацией и actions
 */
function DataTable<T extends Record<string, any>>({
  data,
  totalItems,
  loading = false,
  error = null,
  columns,
  rowKey,
  searchable = false,
  searchPlaceholder = 'Search...',
  searchValue = '',
  onSearch,
  searchDebounce = 500,
  currentPage,
  itemsPerPage,
  onPageChange,
  hidePaginationIfSingle = true,
  actions = [],
  headerActions,
  emptyMessage = 'No items found',
  emptyContent,
  onRowClick,
  className = '',
  useGridLayout = false,
  actionsHeader = 'Edit/Delete',
  onRetry
}: DataTableProps<T>) {

  // === Internal State ===
  const [search, setSearch] = useState(searchValue);
  const [debouncedSearch, setDebouncedSearch] = useState(searchValue);
  const [searching, setSearching] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    config: ConfirmConfig;
    onConfirm: () => void;
  } | null>(null);

  // === Debounced Search ===
  useEffect(() => {
    if (search !== debouncedSearch) {
      setSearching(true);
    }

    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setSearching(false);
    }, searchDebounce);

    return () => clearTimeout(timer);
  }, [search, debouncedSearch, searchDebounce]);

  // Вызываем onSearch когда debounced значение меняется
  useEffect(() => {
    if (onSearch && debouncedSearch !== searchValue) {
      onSearch(debouncedSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  // === Pagination ===
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(totalItems / itemsPerPage));
  }, [totalItems, itemsPerPage]);

  const showPagination = useMemo(() => {
    return !hidePaginationIfSingle || totalPages > 1;
  }, [hidePaginationIfSingle, totalPages]);

  // === Action Handler with Confirmation ===
  const handleActionClick = (
    action: ActionConfig<T>,
    item: T,
    confirmConfig?: ConfirmConfig
  ) => {
    if (confirmConfig) {
      setConfirmModal({
        config: confirmConfig,
        onConfirm: () => {
          action.onClick(item);
          setConfirmModal(null);
        }
      });
    } else {
      action.onClick(item);
    }
  };

  // === Loading State ===
  if (loading && data.length === 0) {
    return (
      <div className={`${styles.container} ${className}`}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  // === Error State ===
  if (error) {
    return (
      <div className={`${styles.container} ${className}`}>
        <div className={styles.error}>
          <p>{error}</p>
          {onRetry && (
            <button onClick={onRetry} className={styles.retryButton}>
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  // === Render ===
  return (
    <div className={`${styles.container} ${className}`}>
      {/* Header: Search + Actions */}
      {(searchable || headerActions) && (
        <div className={styles.header}>
          <div className={styles.headerActions}>
            {searchable && (
              <div className={styles.searchContainer}>
                <input
                  type="search"
                  placeholder={searchPlaceholder}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    // Сбрасываем на первую страницу при новом поиске
                    if (onPageChange) onPageChange(1);
                  }}
                  className={`${styles.search} ${searching ? styles.searching : ''}`}
                />
                {searching && (
                  <div className={styles.searchIndicator}>
                    <span className={styles.spinner}>🔍</span>
                  </div>
                )}
              </div>
            )}
            {headerActions && <div className={styles.headerActionsSlot}>{headerActions}</div>}
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className={styles.tableContainer}>
        {useGridLayout ? (
          // === Grid Layout ===
          <>
            <div className={styles.tableHeader}>
              {columns.map((col) => (
                <div key={col.key} className={styles.headerCell} style={{ width: col.width }}>
                  {col.header}
                </div>
              ))}
              {actions.length > 0 && (
                <div className={styles.headerCell}>{actionsHeader}</div>
              )}
            </div>

            <div className={styles.tableBody}>
              {data.length > 0 ? (
                data.map((item, index) => (
                  <div
                    key={String(item[rowKey])}
                    className={`${styles.tableRow} ${onRowClick ? styles.clickableRow : ''}`}
                    onClick={() => onRowClick?.(item)}
                  >
                    {columns.map((col) => (
                      <div
                        key={col.key}
                        className={styles.cell}
                        style={{ width: col.width, textAlign: col.align }}
                      >
                        {col.render(item, index)}
                      </div>
                    ))}
                    {actions.length > 0 && (
                      <div className={styles.actionsCell}>
                        {actions.map((action, actionIndex) => (
                          <button
                            key={actionIndex}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleActionClick(action, item);
                            }}
                            className={`${styles.actionButton} ${
                              action.variant ? styles[`${action.variant}Button`] : ''
                            }`}
                            title={action.title}
                            disabled={action.disabled?.(item)}
                          >
                            {action.icon}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className={styles.emptyState}>
                  <div className={styles.emptyContent}>
                    <p>{emptyMessage}</p>
                    {emptyContent}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          // === Standard HTML Table ===
          <table className={styles.table}>
            <thead>
              <tr className={styles.tableHeaderRow}>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={styles.tableHeaderCell}
                    style={{ width: col.width, textAlign: col.align }}
                  >
                    {col.header}
                  </th>
                ))}
                {actions.length > 0 && (
                  <th className={styles.tableHeaderCell}>{actionsHeader}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {data.length > 0 ? (
                data.map((item, index) => (
                  <tr
                    key={String(item[rowKey])}
                    className={`${styles.tableRow} ${onRowClick ? styles.clickableRow : ''}`}
                    onClick={() => onRowClick?.(item)}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={styles.tableCell}
                        style={{ width: col.width, textAlign: col.align }}
                      >
                        {col.render(item, index)}
                      </td>
                    ))}
                    {actions.length > 0 && (
                      <td className={styles.tableCell}>
                        <div className={styles.actionButtons}>
                          {actions.map((action, actionIndex) => (
                            <button
                              key={actionIndex}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleActionClick(action, item);
                              }}
                              className={`${styles.actionButton} ${
                                action.variant ? styles[`${action.variant}Button`] : ''
                              }`}
                              title={action.title}
                              disabled={action.disabled?.(item)}
                            >
                              {action.icon}
                            </button>
                          ))}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={columns.length + (actions.length > 0 ? 1 : 0)} className={styles.emptyState}>
                    <div className={styles.emptyContent}>
                      <p>{emptyMessage}</p>
                      {emptyContent}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {showPagination && (
        <div className={styles.pagination}>
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={styles.paginationButton}
          >
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`${styles.paginationButton} ${
                currentPage === page ? styles.activePage : ''
              }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={styles.paginationButton}
          >
            Next
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>{confirmModal.config.title}</h3>
            <p>{confirmModal.config.message}</p>
            <div className={styles.modalActions}>
              <button
                onClick={() => setConfirmModal(null)}
                className={styles.cancelButton}
              >
                {confirmModal.config.cancelText || 'Cancel'}
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className={`${styles.confirmButton} ${
                  confirmModal.config.confirmVariant
                    ? styles[`confirm${confirmModal.config.confirmVariant.charAt(0).toUpperCase() + confirmModal.config.confirmVariant.slice(1)}`]
                    : ''
                }`}
              >
                {confirmModal.config.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay (для загрузки дополнительных данных) */}
      {loading && data.length > 0 && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}>Loading...</div>
        </div>
      )}
    </div>
  );
}

export default DataTable;
