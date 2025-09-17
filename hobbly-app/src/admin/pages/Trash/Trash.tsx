/**
 * @fileoverview Trash Bin page for admin panel
 * @module admin/pages/Trash
 * @description Manage soft-deleted activities with restore/permanent delete options
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../shared/contexts/AuthContext';
import activitiesAPI from '../../../api/activities.api';
import { Activity, UserRole } from '../../../types';
import styles from './Trash.module.css';

/**
 * Trash Bin page component
 * @returns JSX element
 */
const Trash: React.FC = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionConfirm, setActionConfirm] = useState<{
    id: string;
    type: 'restore' | 'permanent';
    title: string;
  } | null>(null);

  const itemsPerPage = 10;

  useEffect(() => {
    loadDeletedActivities();
  }, [currentPage]);

  /**
   * Load deleted activities from API
   */
  const loadDeletedActivities = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get only soft-deleted activities
      const response = await activitiesAPI.getDeletedActivities(
        currentPage,
        itemsPerPage,
        user?.id, // current user ID
        user?.role // current user role
      );

      setActivities(response.data);
      setTotalPages(Math.ceil(response.total / itemsPerPage));
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
      setActionConfirm(null);
      await loadDeletedActivities(); // Reload the list
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
      setActionConfirm(null);
      await loadDeletedActivities(); // Reload the list
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
   * Check if user can manage activity (own activity or admin)
   */
  const canManageActivity = (activity: Activity): boolean => {
    return user?.role === UserRole.ADMIN || activity.userId === user?.id;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading deleted activities...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>{error}</p>
          <button onClick={loadDeletedActivities} className={styles.retryButton}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>RECENTLY DELETED</h1>
      </div>

      {/* Activities Table */}
      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <div className={styles.headerCell}>Name</div>
          <div className={styles.headerCell}>Organisator</div>
          <div className={styles.headerCell}>Date</div>
          <div className={styles.headerCell}>Restore/Delete</div>
        </div>

        <div className={styles.tableBody}>
          {activities.length > 0 ? (
            activities.map((activity) => (
              <div key={activity.id} className={styles.tableRow}>
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
                <div className={styles.cell}>
                  {activity.organizer?.organizationName || 'Unknown'}
                </div>
                <div className={styles.cell}>
                  {formatDate(activity.startDate)}
                </div>
                <div className={styles.actionsCell}>
                  <button
                    onClick={() => setActionConfirm({
                      id: activity.id,
                      type: 'restore',
                      title: activity.title
                    })}
                    className={`${styles.actionButton} ${styles.restoreButton}`}
                    title="Restore activity"
                    disabled={!canManageActivity(activity)}
                  >
                    ✅
                  </button>
                  <button
                    onClick={() => setActionConfirm({
                      id: activity.id,
                      type: 'permanent',
                      title: activity.title
                    })}
                    className={`${styles.actionButton} ${styles.deleteButton}`}
                    title="Delete permanently"
                    disabled={!canManageActivity(activity)}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyContent}>
                <div className={styles.emptyIcon}>🗑️</div>
                <h3>Trash is empty</h3>
                <p>No deleted activities found</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className={styles.paginationButton}
          >
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`${styles.paginationButton} ${
                currentPage === page ? styles.activePage : ''
              }`}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className={styles.paginationButton}
          >
            Next
          </button>
        </div>
      )}

      {/* Action Confirmation Modal */}
      {actionConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>
              {actionConfirm.type === 'restore'
                ? 'Confirm Restoration'
                : 'Confirm Permanent Deletion'
              }
            </h3>
            <p>
              {actionConfirm.type === 'restore'
                ? `Are you sure you want to restore "${actionConfirm.title}"? It will be moved back to active activities.`
                : `Are you sure you want to permanently delete "${actionConfirm.title}"? This action cannot be undone and all data will be lost forever.`
              }
            </p>
            <div className={styles.modalActions}>
              <button
                onClick={() => setActionConfirm(null)}
                className={styles.cancelButton}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (actionConfirm.type === 'restore') {
                    handleRestore(actionConfirm.id);
                  } else {
                    handlePermanentDelete(actionConfirm.id);
                  }
                }}
                className={
                  actionConfirm.type === 'restore'
                    ? styles.confirmRestoreButton
                    : styles.confirmDeleteButton
                }
              >
                {actionConfirm.type === 'restore' ? 'Restore' : 'Delete Forever'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Trash;