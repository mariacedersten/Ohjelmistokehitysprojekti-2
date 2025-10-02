/**
 * @fileoverview Activities Requests page for admin panel
 * @module admin/pages/ActivitiesRequests
 * @description Management page for pending activity requests from organizers
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../shared/contexts/AuthContext';
import activitiesAPI from '../../../api/activities.api';
import { Activity } from '../../../types';
import DataTable, { ColumnConfig, ActionConfig } from '../../components/DataTable';
import styles from './ActivitiesRequests.module.css';

const ActivitiesRequests: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
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
      const res = await activitiesAPI.getPendingActivities({
        page: currentPage,
        limit: pageSize,
        search: searchQuery
      });
      setActivities(res.data);
      setTotal(res.total || 0);
    } catch (e) {
      console.error('Failed to load activity requests:', e);
      setError('Failed to load activity requests.');
    } finally {
      setLoading(false);
    }
  };

  const approve = async (id: string) => {
    try {
      await activitiesAPI.approveActivity(id, true);
      await loadRequests();
    } catch (e) {
      console.error('Approve failed:', e);
    }
  };

  const reject = async (id: string) => {
    try {
      await activitiesAPI.softDeleteActivity(id, user?.id, user?.role);
      await loadRequests();
    } catch (e) {
      console.error('Reject failed:', e);
    }
  };

  const formatPrice = (price?: number): string => {
    return price ? `${price}€/h` : 'Free';
  };

  // Columns configuration
  const columns: ColumnConfig<Activity>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (activity) => (
        <div className={styles.nameCell}>
          <div className={styles.userAvatar}>
            {activity.imageUrl ? (
              <img src={activity.imageUrl} alt={activity.title} />
            ) : (
              <div className={styles.avatarPlaceholder}>A</div>
            )}
          </div>
          <span className={styles.userName}>{activity.title}</span>
        </div>
      )
    },
    {
      key: 'organisation',
      header: 'Organisation',
      render: (activity) => activity.organizer?.organizationName || 'Unknown'
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
      icon: '👁️',
      title: 'View',
      variant: 'view',
      onClick: (activity) => navigate(`/admin/activities/edit/${activity.id}`)
    },
    {
      icon: '✅',
      title: 'Approve',
      variant: 'approve',
      onClick: (activity) => approve(activity.id)
    },
    {
      icon: '🗑️',
      title: 'Reject',
      variant: 'reject',
      onClick: (activity) => reject(activity.id)
    }
  ];

  return (
    <div className={styles.container}>
      <DataTable
        data={activities}
        totalItems={total}
        loading={loading}
        error={error}
        columns={columns}
        actions={actions}
        rowKey="id"
        searchable
        searchPlaceholder="Search requests..."
        onSearch={loadRequests}
        currentPage={currentPage}
        itemsPerPage={pageSize}
        onPageChange={setCurrentPage}
        actionsHeader="Actions"
        emptyMessage="No activity requests found."
        onRetry={loadRequests}
      />
    </div>
  );
};

export default ActivitiesRequests;

