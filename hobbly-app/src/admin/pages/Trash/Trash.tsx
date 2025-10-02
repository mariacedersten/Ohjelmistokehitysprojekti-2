/**
 * @fileoverview Trash Bin page for admin panel
 * @module admin/pages/Trash
 * @description Manage soft-deleted activities with restore/permanent delete options
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../shared/contexts/AuthContext';
import activitiesAPI from '../../../api/activities.api';
import { Activity, UserRole } from '../../../types';
import DataTable, { ColumnConfig, ActionConfig } from '../../components/DataTable';
import styles from './Trash.module.css';

/**
 * Trash Bin page component
 * @returns JSX element
 */
const Trash: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  useEffect(() => {
    loadDeletedActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  /**
   * Load deleted activities from API
   */
  const loadDeletedActivities = async (searchQuery = '') => {
    try {
      setLoading(true);
      setError(null);

      const response = await activitiesAPI.getDeletedActivities(
        currentPage,
        itemsPerPage,
        user?.id,
        user?.role,
        searchQuery
      );

      setActivities(response.data);
      setTotal(response.total);
    } catch (err) {
      console.error('Failed to load deleted activities:', err);
      setError('Failed to load deleted activities. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle activity restoration
   */
  const handleRestore = async (activityId: string) => {
    try {
      await activitiesAPI.restoreActivity(activityId, user?.id, user?.role);
      await loadDeletedActivities();
    } catch (err) {
      console.error('Failed to restore activity:', err);
      setError('Failed to restore activity. Please try again.');
    }
  };

  /**
   * Handle permanent activity deletion
   */
  const handlePermanentDelete = async (activityId: string) => {
    try {
      await activitiesAPI.permanentDeleteActivity(activityId, user?.id, user?.role);
      await loadDeletedActivities();
    } catch (err) {
      console.error('Failed to permanently delete activity:', err);
      setError('Failed to permanently delete activity. Please try again.');
    }
  };

  /**
   * Format date for display
   */
  const formatDate = (date: Date | string | undefined): string => {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('fi-FI', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  /**
   * Check if user can manage activity
   */
  const canManageActivity = (activity: Activity): boolean => {
    return user?.role === UserRole.ADMIN || activity.userId === user?.id;
  };

  // Columns configuration (using grid layout)
  const columns: ColumnConfig<Activity>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (activity) => (
        <div className={styles.nameCell}>
          <div className={styles.activityImage}>
            <img
              src={activity.imageUrl || '/assets/default-activity.png'}
              alt={activity.title}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = '/assets/default-activity.png';
              }}
            />
          </div>
          <div className={styles.activityDetails}>
            <span className={styles.activityName}>{activity.title}</span>
            <span className={styles.activityCategory}>
              {activity.category?.name || activity.type}
            </span>
          </div>
        </div>
      )
    },
    {
      key: 'organizer',
      header: 'Organisator',
      render: (activity) => activity.organizer?.organizationName || 'Unknown'
    },
    {
      key: 'date',
      header: 'Date',
      render: (activity) => formatDate(activity.startDate)
    }
  ];

  // Actions configuration
  const actions: ActionConfig<Activity>[] = [
    {
      icon: '👁️',
      title: 'View activity',
      variant: 'view',
      onClick: (activity) => navigate(`/admin/activities/edit/${activity.id}`)
    },
    {
      icon: '✅',
      title: 'Restore activity',
      variant: 'restore',
      onClick: (activity) => handleRestore(activity.id),
      disabled: (activity) => !canManageActivity(activity)
    },
    {
      icon: '🗑️',
      title: 'Delete permanently',
      variant: 'permanent',
      onClick: (activity) => handlePermanentDelete(activity.id),
      disabled: (activity) => !canManageActivity(activity)
    }
  ];

  return (
    <DataTable
      data={activities}
      totalItems={total}
      loading={loading}
      error={error}
      columns={columns}
      actions={actions}
      rowKey="id"
      searchable
      searchPlaceholder="Search deleted..."
      onSearch={loadDeletedActivities}
      currentPage={currentPage}
      itemsPerPage={itemsPerPage}
      onPageChange={setCurrentPage}
      actionsHeader="Restore/Delete"
      emptyMessage="Trash is empty"
      emptyContent={
        <div className={styles.emptyIcon}>🗑️</div>
      }
      onRetry={loadDeletedActivities}
    />
  );
};

export default Trash;
