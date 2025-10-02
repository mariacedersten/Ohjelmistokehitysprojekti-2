/**
 * @fileoverview Activities Management page for admin panel
 * @module admin/pages/Activities
 * @description Table-based activities management with CRUD operations
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../shared/contexts/AuthContext';
import activitiesAPI from '../../../api/activities.api';
import { Activity, UserRole } from '../../../types';
import DataTable, { ColumnConfig, ActionConfig } from '../../components/DataTable';
import styles from './Activities.module.css';

/**
 * Activities Management page component
 * @returns JSX element
 */
const Activities: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation() as { state?: { successMessage?: string } };
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [showInfoNotice, setShowInfoNotice] = useState(true);

  const itemsPerPage = 10;

  // Show one-time toast after successful creation
  useEffect(() => {
    if (location?.state?.successMessage) {
      setToastMessage(location.state.successMessage);
      setShowToast(true);
      navigate('/admin/activities', { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Load activities from API
   */
  const loadActivities = async (searchQuery = '') => {
    try {
      setLoading(true);
      setError(null);

      const response = await activitiesAPI.getAllActivitiesForAdmin(
        { search: searchQuery },
        currentPage,
        itemsPerPage,
        'created_at',
        false,
        user?.id,
        user?.role
      );

      setActivities(response.data);
      setTotal(response.total);
    } catch (err) {
      console.error('Failed to load activities:', err);
      setError('Failed to load activities. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Load activities on mount and page change
  useEffect(() => {
    loadActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  /**
   * Handle activity deletion
   */
  const handleDelete = async (activityId: string) => {
    try {
      await activitiesAPI.deleteActivity(activityId, user?.id, user?.role);
      await loadActivities();
    } catch (err) {
      console.error('Failed to delete activity:', err);
      setError('Failed to delete activity. Please try again.');
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
   * Format price for display
   */
  const formatPrice = (price: number | undefined): string => {
    if (!price) return 'Free';
    return `${price}€/h`;
  };

  // Columns configuration
  const columns: ColumnConfig<Activity>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (activity) => (
        <div className={styles.activityInfo}>
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
            {user?.role === UserRole.ORGANIZER && activity.isApproved === false && (
              <span style={{
                marginTop: 6,
                display: 'inline-block',
                padding: '2px 8px',
                borderRadius: 12,
                background: '#FFF1F0',
                color: '#D4380D',
                border: '1px solid #FFA39E',
                fontSize: 12,
                fontWeight: 600
              }}>Pending approval</span>
            )}
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
    },
    {
      key: 'location',
      header: 'Location',
      render: (activity) => activity.location
    },
    {
      key: 'price',
      header: 'Price',
      render: (activity) => formatPrice(activity.price)
    }
  ];

  // Actions configuration
  const actions: ActionConfig<Activity>[] = [
    {
      icon: '✏️',
      title: 'Edit activity',
      variant: 'edit',
      onClick: (activity) => navigate(`/admin/activities/edit/${activity.id}`)
    },
    {
      icon: '🗑️',
      title: 'Delete activity',
      variant: 'delete',
      onClick: (activity) => handleDelete(activity.id)
    }
  ];

  return (
    <div className={styles.container}>
      {/* Pending approval notice for organizers */}
      {user?.role === UserRole.ORGANIZER && activities.some(a => a.isApproved === false) && showInfoNotice && (
        <div className={styles.infoWrapper}>
          <div className={styles.infoNotice} role="status" aria-live="polite">
            <span>
              Activities created by you appear after administrator approval. Pending items are marked as "Pending approval".
            </span>
            <button
              type="button"
              className={styles.infoClose}
              aria-label="Dismiss this message"
              onClick={() => setShowInfoNotice(false)}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {showToast && toastMessage && (
        <div className={styles.toast} role="status" aria-live="polite">
          <div className={styles.toastContent}>
            {toastMessage}
          </div>
          <button
            type="button"
            className={styles.toastClose}
            aria-label="Close notification"
            onClick={() => setShowToast(false)}
          >
            ×
          </button>
        </div>
      )}

      {/* DataTable */}
      <DataTable
        data={activities}
        totalItems={total}
        loading={loading}
        error={error}
        columns={columns}
        actions={actions}
        rowKey="id"
        searchable
        searchPlaceholder="Search activities..."
        onSearch={loadActivities}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        headerActions={
          <Link to="/admin/activities/new" className={styles.addButton}>
            Add activity
          </Link>
        }
        emptyMessage="No activities found"
        emptyContent={
          <Link to="/admin/activities/new" className={styles.createButton}>
            Create your first activity
          </Link>
        }
        onRetry={loadActivities}
      />
    </div>
  );
};

export default Activities;
