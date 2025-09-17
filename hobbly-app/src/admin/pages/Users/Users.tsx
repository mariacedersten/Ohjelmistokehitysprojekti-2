/**
 * @fileoverview Users Management page for admin panel (Admin only)
 * @module admin/pages/Users
 * @description Table-based users management with CRUD operations
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../shared/contexts/AuthContext';
import usersAPI from '../../../api/users.api';
import { User, UserRole } from '../../../types';
import styles from './Users.module.css';

/**
 * Users Management page component (Admin only)
 * @returns JSX element
 */
const Users: React.FC = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const itemsPerPage = 10;

  useEffect(() => {
    // Check if user has admin role
    if (user?.role !== UserRole.ADMIN) {
      setError('Access denied. Admin role required.');
      setLoading(false);
      return;
    }

    loadUsers();
  }, [currentPage, search, user]);

  /**
   * Load users from API
   */
  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await usersAPI.getUsers({
        page: currentPage,
        limit: itemsPerPage,
        search: search || undefined
      });
      setUsers(response.data);
      setTotalPages(Math.ceil(response.total / itemsPerPage));
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
      setDeleteConfirm(null);
      await loadUsers(); // Reload the list
    } catch (err) {
      console.error('Failed to delete user:', err);
      setError('Failed to delete user. Please try again.');
    }
  };

  /**
   * Handle user role update
   */
  const handleRoleUpdate = async (userId: string, newRole: UserRole) => {
    try {
      await usersAPI.updateUser(userId, { role: newRole });
      await loadUsers(); // Reload the list
    } catch (err) {
      console.error('Failed to update user role:', err);
      setError('Failed to update user role. Please try again.');
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
   * Format phone number for display
   */
  const formatPhone = (phone: string | undefined): string => {
    if (!phone) return 'N/A';
    return phone;
  };

  /**
   * Get user avatar placeholder
   */
  const getUserAvatar = (user: User): string => {
    if (user.profilePhotoUrl) {
      return user.profilePhotoUrl;
    }
    // Return reliable avatar placeholder based on user name initials
    const initials = user.fullName
      ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()
      : user.email[0].toUpperCase();
    // Use ui-avatars.com which is more reliable than via.placeholder.com
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=48&background=f0f0f0&color=666&format=png`;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading users...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>{error}</p>
          {user?.role === UserRole.ADMIN && (
            <button onClick={loadUsers} className={styles.retryButton}>
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerActions}>
          <input
            type="search"
            placeholder="Search users..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className={styles.search}
          />
        </div>
      </div>

      {/* Users Table */}
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr className={styles.tableHeader}>
              <th className={styles.tableHeaderCell}>Name</th>
              <th className={styles.tableHeaderCell}>Organisation</th>
              <th className={styles.tableHeaderCell}>Date of adding</th>
              <th className={styles.tableHeaderCell}>Phone number</th>
              <th className={styles.tableHeaderCell}>E-mail</th>
              <th className={styles.tableHeaderCell}></th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((userData) => (
                <tr key={userData.id} className={styles.tableRow}>
                  <td className={styles.tableCell}>
                    <div className={styles.userInfo}>
                      <div className={styles.userAvatar}>
                        <img
                          src={getUserAvatar(userData)}
                          alt={userData.fullName || userData.email}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            const initials = userData.fullName
                              ? userData.fullName.split(' ').map(n => n[0]).join('').toUpperCase()
                              : userData.email[0].toUpperCase();
                            // Use ui-avatars.com which is more reliable than via.placeholder.com
                            target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=48&background=f0f0f0&color=666&format=png`;
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
                  </td>
                  <td className={styles.tableCell}>
                    {userData.organizationName || 'N/A'}
                  </td>
                  <td className={styles.tableCell}>
                    {formatDate(userData.createdAt)}
                  </td>
                  <td className={styles.tableCell}>
                    {formatPhone(userData.phone)}
                  </td>
                  <td className={styles.tableCell}>
                    {userData.email}
                  </td>
                  <td className={styles.tableCell}>
                    <div className={styles.actionButtons}>
                      <button
                        onClick={() => {
                          const newRole = userData.role === UserRole.ADMIN
                            ? UserRole.ORGANIZER
                            : UserRole.ADMIN;
                          handleRoleUpdate(userData.id, newRole);
                        }}
                        className={styles.editButton}
                        title="Toggle admin role"
                        disabled={userData.id === user?.id} // Prevent self-modification
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(userData.id)}
                        className={styles.deleteButton}
                        title="Delete user"
                        disabled={userData.id === user?.id} // Prevent self-deletion
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
                    <p>No users found</p>
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
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete this user? This action cannot be undone.</p>
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
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;