/**
 * @fileoverview Users Requests page for admin panel
 * @module admin/pages/UsersRequests
 * @description Management page for pending user registration requests
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../shared/contexts/AuthContext';
import usersAPI from '../../../api/users.api';
import { User } from '../../../types';
import DataTable, { ColumnConfig, ActionConfig, dataTableStyles } from '../../components/DataTable';
import styles from './UsersRequests.module.css';

const UsersRequests: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    onConfirm: () => void;
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const loadRequests = async (searchQuery = '') => {
    try {
      setLoading(true);
      setError(null);
      const res = await usersAPI.getUsers({
        page: currentPage,
        limit: pageSize,
        isApproved: false,
        search: searchQuery
      });
      setUsers(res.data);
      setTotal(res.total || 0);
    } catch (e) {
      console.error('Failed to load user requests:', e);
      setError('Failed to load user requests.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get user avatar placeholder
   */
  const getUserAvatar = (userData: User): string => {
    if (userData.photoUrl) return userData.photoUrl;
    const initials = userData.fullName
      ? userData.fullName.split(' ').map(n => n[0]).join('').toUpperCase()
      : userData.email[0].toUpperCase();
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=48&background=f0f0f0&color=666&format=png`;
  };

  const approve = async (id: string) => {
    try {
      setError(null);
      await usersAPI.approveUser(id, true);
      setToastMessage('User approved successfully');
      setShowToast(true);
      await loadRequests();
    } catch (e) {
      console.error('Approve failed:', e);
      setError('Failed to approve user');
    }
  };

  const reject = async (id: string) => {
    setConfirmModal({
      title: 'Delete User?',
      message: 'Are you sure you want to permanently delete this user? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          setError(null);
          setConfirmModal(null);

          await usersAPI.permanentDeleteUser(id);
          setToastMessage('User deleted successfully');
          setShowToast(true);
          await loadRequests();
        } catch (e) {
          console.error('Delete failed:', e);
          setError('Failed to delete user');
        }
      }
    });
  };

  // Columns configuration
  const columns: ColumnConfig<User>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (userData) => (
        <div className={styles.nameCell}>
          <div
            className={`${styles.userAvatar} ${styles.clickableAvatar}`}
            onClick={() => navigate(`/admin/personal-info?userId=${userData.id}`)}
            title="View profile"
          >
            <img
              src={getUserAvatar(userData)}
              alt={userData.fullName || userData.email}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = getUserAvatar(userData);
              }}
            />
          </div>
          <div className={styles.userDetails}>
            <span className={styles.userName}>{userData.fullName || userData.email}</span>
            <span className={styles.userRole}>{userData.role}</span>
          </div>
        </div>
      )
    },
    {
      key: 'organisation',
      header: 'Organisation',
      render: (userData) => userData.organizationName || '—'
    },
    {
      key: 'phone',
      header: 'Phone number',
      render: (userData) => userData.phone || '—'
    },
    {
      key: 'email',
      header: 'E-mail',
      render: (userData) => userData.email
    }
  ];

  // Actions configuration
  const actions: ActionConfig<User>[] = [
    {
      icon: '👁️',
      title: 'View',
      variant: 'view',
      onClick: (userData) => navigate(`/admin/personal-info?userId=${userData.id}`)
    },
    {
      icon: '✅',
      title: 'Approve',
      variant: 'approve',
      onClick: (userData) => approve(userData.id)
    },
    {
      icon: '🗑️',
      title: 'Reject',
      variant: 'reject',
      onClick: (userData) => reject(userData.id)
    }
  ];

  return (
    <div className={styles.container}>
      {/* Toast Notification */}
      {showToast && toastMessage && (
        <div className={dataTableStyles.toast} role="status" aria-live="polite">
          <div className={dataTableStyles.toastContent}>
            {toastMessage}
          </div>
          <button
            type="button"
            className={dataTableStyles.toastClose}
            aria-label="Close notification"
            onClick={() => setShowToast(false)}
          >
            ×
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className={dataTableStyles.modalOverlay}>
          <div className={dataTableStyles.modal}>
            <h3>{confirmModal.title}</h3>
            <p>{confirmModal.message}</p>
            <div className={dataTableStyles.modalActions}>
              <button
                onClick={() => setConfirmModal(null)}
                className={dataTableStyles.cancelButton}
              >
                {confirmModal.cancelText}
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className={dataTableStyles.confirmButton}
              >
                {confirmModal.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      <DataTable
        data={users}
        totalItems={total}
        loading={loading}
        error={error}
        columns={columns}
        actions={actions}
        rowKey="id"
        searchable
        searchPlaceholder="Search users..."
        onSearch={loadRequests}
        currentPage={currentPage}
        itemsPerPage={pageSize}
        onPageChange={setCurrentPage}
        actionsHeader="Actions"
        emptyMessage="No user requests found."
        onRetry={loadRequests}
      />
    </div>
  );
};

export default UsersRequests;

