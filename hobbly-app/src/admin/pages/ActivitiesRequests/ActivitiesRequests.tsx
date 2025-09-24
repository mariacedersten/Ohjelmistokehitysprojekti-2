/**
 * @fileoverview Activities Requests page for admin panel
 * @module admin/pages/ActivitiesRequests
 * @description Management page for pending activity requests from organizers
 */

import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../shared/contexts/AuthContext';
import activitiesAPI from '../../../api/activities.api';
import { Activity } from '../../../types';
import styles from './ActivitiesRequests.module.css';

interface ActivityRequestView {
  id: string;
  title: string;
  organisation: string;
  location: string;
  price: string;
  imageUrl?: string;
}

const ActivitiesRequests: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<ActivityRequestView[]>([]);
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
        const res = await activitiesAPI.getPendingActivities({ page: currentPage, limit: pageSize, search: debouncedSearch });
        const mapped: ActivityRequestView[] = res.data.map((a: Activity) => ({
          id: a.id,
          title: a.title,
          organisation: a.organizer?.organizationName || 'Unknown',
          location: a.location,
          price: a.price ? `${a.price}€/h` : 'Free',
          imageUrl: a.imageUrl
        }));
        setItems(mapped);
        setTotal(res.total || 0);
      } catch (e) {
        console.error('Failed to load activity requests:', e);
        setError('Failed to load activity requests.');
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
      await activitiesAPI.approveActivity(id, true);
      setItems((prev) => prev.filter((it) => it.id !== id));
    } catch (e) {
      console.error('Approve failed:', e);
    }
  };

  const reject = async (id: string) => {
    try {
      await activitiesAPI.softDeleteActivity(id, user?.id, user?.role);
      setItems((prev) => prev.filter((it) => it.id !== id));
    } catch (e) {
      console.error('Reject failed:', e);
    }
  };

  const view = (id: string) => {
    navigate(`/admin/activities/edit/${id}`);
  };

  if (initialLoading) {
    return (
      <div className={styles.container}><div className={styles.loading}>Loading activity requests...</div></div>
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
              placeholder="Search requests..."
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
          <div className={styles.headerCell}>Location</div>
          <div className={styles.headerCell}>Price</div>
          <div className={styles.headerCell}>Actions</div>
        </div>

        <div className={styles.tableBody}>
          {items.length === 0 ? (
            <div className={styles.emptyState}>No activity requests found.</div>
          ) : (
            items.map((request) => (
              <div key={request.id} className={styles.tableRow}>
                <div className={styles.nameCell}>
                  <div className={styles.userAvatar}>
                    {request.imageUrl ? (<img src={request.imageUrl} alt={request.title} />) : (<div className={styles.avatarPlaceholder}>A</div>)}
                  </div>
                  <span className={styles.userName}>{request.title}</span>
                </div>
                <div className={styles.cell}>{request.organisation}</div>
                <div className={styles.cell}>{request.location}</div>
                <div className={styles.cell}>{request.price}</div>
                <div className={styles.actionsCell}>
                  <button onClick={() => view(request.id)} className={`${styles.actionButton} ${styles.viewButton}`} title="View">
                    👁️
                  </button>
                  <button onClick={() => approve(request.id)} className={`${styles.actionButton} ${styles.approveButton}`} title="Approve">✅</button>
                  <button onClick={() => reject(request.id)} className={`${styles.actionButton} ${styles.rejectButton}`} title="Reject">🗑️</button>
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

export default ActivitiesRequests;

