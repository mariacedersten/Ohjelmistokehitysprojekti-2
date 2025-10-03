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
import DataTable, { ColumnConfig, ActionConfig } from '../../components/DataTable';
import styles from './UsersRequests.module.css';

const UsersRequests: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
      await usersAPI.approveUser(id, true);
      await loadRequests();
    } catch (e) {
      console.error('Approve failed:', e);
    }
  };

  const reject = async (id: string) => {
    try {
      await usersAPI.updateUser(id, { isApproved: false });
      await loadRequests();
    } catch (e) {
      console.error('Reject failed:', e);
    }
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

