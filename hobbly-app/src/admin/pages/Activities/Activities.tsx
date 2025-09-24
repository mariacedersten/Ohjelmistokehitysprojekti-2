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
  const [initialLoading, setInitialLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [showInfoNotice, setShowInfoNotice] = useState(true);

  const itemsPerPage = 10;

  // Debounce search input (wait 500ms after user stops typing)
  useEffect(() => {
    // Show searching indicator when user is typing
    if (search !== debouncedSearch) {
      setSearching(true);
    }

    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      // Reset to first page when search changes
      if (search !== debouncedSearch) {
        setCurrentPage(1);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [search, debouncedSearch]);

  // Load activities when page or debounced search changes
  useEffect(() => {
    loadActivities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, debouncedSearch]);

  // Show one-time toast after successful creation (message comes from navigation state)
  useEffect(() => {
    if (location?.state?.successMessage) {
      setToastMessage(location.state.successMessage);
      setShowToast(true);
      // Clear navigation state so it won't reappear on refresh/back
      navigate('/admin/activities', { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // No persistence for banner visibility; it depends only on current data

  /**
   * Load activities from API
   */
  const loadActivities = async () => {
    try {
      setError(null);

      const response = await activitiesAPI.getAllActivitiesForAdmin(
        { search: debouncedSearch },
        currentPage,
        itemsPerPage,
        'created_at',
        false, // newest first
        user?.id,
        user?.role
      );

      setActivities(response.data);
      setTotalPages(Math.ceil(response.total / itemsPerPage));
    } catch (err) {
      console.error('Failed to load activities:', err);
      setError('Failed to load activities. Please try again.');
    } finally {
      setInitialLoading(false); // Only set false after first load
      setSearching(false); // Hide searching indicator
    }
  };

  /**
   * Handle activity deletion
   */
  const handleDelete = async (activityId: string) => {
    try {
      await activitiesAPI.deleteActivity(activityId, user?.id, user?.role);
      setDeleteConfirm(null);
      await loadActivities(); // Reload the list
    } catch (err) {
      console.error('Failed to delete activity:', err);
      setError('Failed to delete activity. Please try again.');
    }
  };

  /**
   * Handle edit activity
   */
  const handleEdit = (activityId: string) => {
    navigate(`/admin/activities/edit/${activityId}`);
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

  if (initialLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading activities...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>{error}</p>
          <button onClick={loadActivities} className={styles.retryButton}>
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
        <div className={styles.headerActions}>
          <div className={styles.searchContainer}>
            <input
              type="search"
              placeholder="Search activities..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className={`${styles.search} ${searching ? styles.searching : ''}`}
            />
            {searching && (
              <div className={styles.searchIndicator}>
                <span className={styles.spinner}>🔍</span>
              </div>
            )}
          </div>
          <Link to="/admin/activities/new" className={styles.addButton}>
            Add activity
          </Link>
        </div>
      </div>

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
              onClick={() => {
                setShowInfoNotice(false);
              }}
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

      {/* Activities Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr className={styles.tableHeader}>
              <th className={styles.tableHeaderCell}>Name</th>
              <th className={styles.tableHeaderCell}>Organisator</th>
              <th className={styles.tableHeaderCell}>Date</th>
              <th className={styles.tableHeaderCell}>Location</th>
              <th className={styles.tableHeaderCell}>Price</th>
              <th className={styles.tableHeaderCell}>Edit/Delete</th>
            </tr>
          </thead>
          <tbody>
              {activities.length > 0 ? (
              activities.map((activity) => (
                <tr key={activity.id} className={styles.tableRow}>
                  <td className={styles.tableCell}>
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
                  </td>
                  <td className={styles.tableCell}>
                    {activity.organizer?.organizationName || 'Unknown'}
                  </td>
                  <td className={styles.tableCell}>
                    {formatDate(activity.startDate)}
                  </td>
                  <td className={styles.tableCell}>
                    {activity.location}
                  </td>
                  <td className={styles.tableCell}>
                    {formatPrice(activity.price)}
                  </td>
                  <td className={styles.tableCell}>
                    <div className={styles.actionButtons}>
                      <button
                        onClick={() => handleEdit(activity.id)}
                        className={styles.editButton}
                        title="Edit activity"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(activity.id)}
                        className={styles.deleteButton}
                        title="Delete activity"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className={styles.emptyState}>
                  <div className={styles.emptyContent}>
                    <p>No activities found</p>
                    <Link to="/admin/activities/new" className={styles.createButton}>
                      Create your first activity
                    </Link>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
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

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Move Activity to Trash</h3>
            <p>Are you sure you want to remove this activity? It will be moved to the Trash bin and can be restored later from there.</p>
            <div className={styles.modalActions}>
              <button
                onClick={() => setDeleteConfirm(null)}
                className={styles.cancelButton}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className={styles.confirmDeleteButton}
              >
                Move to Trash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Activities;
