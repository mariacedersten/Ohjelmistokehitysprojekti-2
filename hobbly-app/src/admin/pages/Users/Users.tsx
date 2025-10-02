/**
 * @fileoverview Users Management page for admin panel (Admin only)
 * @module admin/pages/Users
 * @description Table-based users management with CRUD operations
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../shared/contexts/AuthContext';
import usersAPI from '../../../api/users.api';
import { User, UserRole } from '../../../types';
import DataTable, { ColumnConfig, ActionConfig } from '../../components/DataTable';
import styles from './Users.module.css';

/**
 * Users Management page component (Admin only)
 * @returns JSX element
 */
const Users: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  // Check admin access
  useEffect(() => {
    if (user?.role !== UserRole.ADMIN) {
      setError('Access denied. Admin role required.');
      return;
    }
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, user]);

  /**
   * Load users from API
   */
  const loadUsers = async (searchQuery = '') => {
    if (user?.role !== UserRole.ADMIN) return;

    try {
      setLoading(true);
      setError(null);

      const response = await usersAPI.getUsers({
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery || undefined,
        isApproved: true
      });
      setUsers(response.data);
      setTotal(response.total);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle user deletion
   */
  const handleDelete = async (userId: string) => {
    try {
      await usersAPI.deleteUser(userId);
      await loadUsers();
    } catch (err) {
      console.error('Failed to delete user:', err);
      setError('Failed to delete user. Please try again.');
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
   * Get user avatar placeholder
   */
  const getUserAvatar = (userData: User): string => {
    if (userData.photoUrl) return userData.photoUrl;
    const initials = userData.fullName
      ? userData.fullName.split(' ').map(n => n[0]).join('').toUpperCase()
      : userData.email[0].toUpperCase();
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=48&background=f0f0f0&color=666&format=png`;
  };

  // Columns configuration
  const columns: ColumnConfig<User>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (userData) => (
        <div className={styles.userInfo}>
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
            <span className={styles.userName}>
              {userData.fullName || userData.email.split('@')[0]}
            </span>
            <span className={styles.userRole}>{userData.role}</span>
          </div>
        </div>
      )
    },
    {
      key: 'organization',
      header: 'Organisation',
      render: (userData) => userData.organizationName || 'N/A'
    },
    {
      key: 'date',
      header: 'Date of adding',
      render: (userData) => formatDate(userData.createdAt)
    },
    {
      key: 'phone',
      header: 'Phone number',
      render: (userData) => userData.phone || 'N/A'
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
      icon: '✏️',
      title: 'Edit user',
      variant: 'edit',
      onClick: (userData) => navigate(`/admin/personal-info?userId=${userData.id}`),
      disabled: (userData) => userData.id === user?.id
    },
    {
      icon: '🗑️',
      title: 'Delete user',
      variant: 'delete',
      onClick: (userData) => handleDelete(userData.id),
      disabled: (userData) => userData.id === user?.id
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
        onSearch={loadUsers}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        emptyMessage="No users found"
        onRetry={loadUsers}
      />
    </div>
  );
};

export default Users;