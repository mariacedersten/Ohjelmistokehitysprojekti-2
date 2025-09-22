/**
 * @fileoverview Users Requests page for admin panel
 * @module admin/pages/UsersRequests
 * @description Management page for pending user registration requests
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../../shared/contexts/AuthContext';
import usersAPI from '../../../api/users.api';
import styles from './UsersRequests.module.css';

interface UserRequest {
  id: string;
  name: string;
  organisation: string;
  phoneNumber: string;
  email: string;
  userAvatar?: string;
}

const UsersRequests: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<UserRequest[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 10;
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

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

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        const res = await usersAPI.getUsers({ page: currentPage, limit: pageSize, isApproved: false, search: debouncedSearch });
        const mapped: UserRequest[] = res.data.map(u => ({
          id: u.id,
          name: u.fullName || u.email,
          organisation: u.organizationName || '—',
          phoneNumber: u.phone || '—',
          email: u.email
        }));
        setItems(mapped);
        setTotal(res.total || 0);
      } catch (e) {
        console.error('Failed to load user requests:', e);
        setError('Failed to load user requests.');
      } finally {
        setInitialLoading(false);
        setSearching(false);
      }
    };
    load();
  }, [currentPage, debouncedSearch]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize]);

  const approve = async (id: string) => {
    try {
      await usersAPI.approveUser(id, true);
      setItems(prev => prev.filter(it => it.id !== id));
    } catch (e) {
      console.error('Approve failed:', e);
    }
  };

  const reject = async (id: string) => {
    try {
      await usersAPI.updateUser(id, { isApproved: false });
      setItems(prev => prev.filter(it => it.id !== id));
    } catch (e) {
      console.error('Reject failed:', e);
    }
  };

  if (initialLoading) {
    return (
      <div className={styles.container}><div className={styles.loading}>Loading user requests...</div></div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}><div className={styles.error}>{error}</div></div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerActions}>
          <div className={styles.searchContainer}>
            <input
              type="search"
              placeholder="Search users..."
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
        </div>
      </div>

      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <div className={styles.headerCell}>Name</div>
          <div className={styles.headerCell}>Organisation</div>
          <div className={styles.headerCell}>Phone number</div>
          <div className={styles.headerCell}>E-mail</div>
          <div className={styles.headerCell}>Actions</div>
        </div>

        <div className={styles.tableBody}>
          {items.length === 0 ? (
            <div className={styles.emptyState}>No user requests found.</div>
          ) : (
            items.map((req) => (
              <div key={req.id} className={styles.tableRow}>
                <div className={styles.nameCell}>
                  <div className={styles.userAvatar}>
                    {req.userAvatar ? (<img src={req.userAvatar} alt={req.name} />) : (<div className={styles.avatarPlaceholder}>{req.name.charAt(0)}</div>)}
                  </div>
                  <span className={styles.userName}>{req.name}</span>
                </div>
                <div className={styles.cell}>{req.organisation}</div>
                <div className={styles.cell}>{req.phoneNumber}</div>
                <div className={styles.cell}>{req.email}</div>
                <div className={styles.actionsCell}>
                  <button onClick={() => approve(req.id)} className={`${styles.actionButton} ${styles.approveButton}`} title="Approve">✅</button>
                  <button onClick={() => reject(req.id)} className={`${styles.actionButton} ${styles.rejectButton}`} title="Reject">🗑️</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className={styles.pagination}>
        <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className={styles.paginationButton}>Previous</button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
          <button key={p} onClick={() => setCurrentPage(p)} className={`${styles.paginationButton} ${p === currentPage ? styles.paginationButtonActive : ''}`}>{p}</button>
        ))}
        <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className={styles.paginationButton}>Next</button>
      </div>
    </div>
  );
};

export default UsersRequests;

