/**
 * @fileoverview Admin dashboard page component
 * @module admin/pages/Dashboard
 * @description Analytics dashboard with statistics and overview
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../shared/contexts/AuthContext';
import activitiesAPI from '../../../api/activities.api';
import usersAPI from '../../../api/users.api';
import { UserRole, Activity } from '../../../types';
import styles from './Dashboard.module.css';

interface DashboardStats {
  totalActivities: number;
  approvedActivities: number;
  pendingActivities: number;
  totalUsers: number;
  pendingUsers: number;
  recentActivities: Activity[];
}

/**
 * Admin Dashboard page component
 * @returns JSX element
 */
const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalActivities: 0,
    approvedActivities: 0,
    pendingActivities: 0,
    totalUsers: 0,
    pendingUsers: 0,
    recentActivities: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load activities stats
      const activitiesResponse = await activitiesAPI.getActivities({}, 1, 5);
      const recentActivities = activitiesResponse.data;
      
      // Calculate activities stats
      const approvedActivities = recentActivities.filter((a: Activity) => a.isApproved).length;
      const pendingActivities = recentActivities.filter((a: Activity) => !a.isApproved).length;
      
      let usersStats = { total: 0, pending: 0 };
      
      // Load users stats (only for admins)
      if (user?.role === UserRole.ADMIN) {
        try {
          usersStats = await usersAPI.getUsersStats();
        } catch (error) {
          console.error('Failed to load users stats:', error);
        }
      }

      setStats({
        totalActivities: activitiesResponse.total || recentActivities.length,
        approvedActivities,
        pendingActivities,
        totalUsers: usersStats.total,
        pendingUsers: usersStats.pending,
        recentActivities
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>
          Welcome back, {user?.fullName || user?.email?.split('@')[0]}!
        </h1>
        <p className={styles.subtitle}>
          Here's an overview of your {user?.role === UserRole.ADMIN ? 'platform' : 'activities'}
        </p>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📊</div>
          <div className={styles.statContent}>
            <div className={styles.statNumber}>{stats.totalActivities}</div>
            <div className={styles.statLabel}>Total Activities</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>✅</div>
          <div className={styles.statContent}>
            <div className={styles.statNumber}>{stats.approvedActivities}</div>
            <div className={styles.statLabel}>Approved Activities</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>⏳</div>
          <div className={styles.statContent}>
            <div className={styles.statNumber}>{stats.pendingActivities}</div>
            <div className={styles.statLabel}>Pending Activities</div>
          </div>
        </div>

        {user?.role === UserRole.ADMIN && (
          <>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>👥</div>
              <div className={styles.statContent}>
                <div className={styles.statNumber}>{stats.totalUsers}</div>
                <div className={styles.statLabel}>Total Users</div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>👤</div>
              <div className={styles.statContent}>
                <div className={styles.statNumber}>{stats.pendingUsers}</div>
                <div className={styles.statLabel}>Pending Users</div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Quick Actions</h2>
        <div className={styles.actionsGrid}>
          <Link to="/admin/activities/new" className={styles.actionCard}>
            <div className={styles.actionIcon}>➕</div>
            <div className={styles.actionTitle}>Add New Activity</div>
            <div className={styles.actionDescription}>Create a new activity listing</div>
          </Link>

          <Link to="/admin/activities" className={styles.actionCard}>
            <div className={styles.actionIcon}>📋</div>
            <div className={styles.actionTitle}>Manage Activities</div>
            <div className={styles.actionDescription}>View and edit your activities</div>
          </Link>

          {user?.role === UserRole.ADMIN && (
            <Link to="/admin/users" className={styles.actionCard}>
              <div className={styles.actionIcon}>👥</div>
              <div className={styles.actionTitle}>Manage Users</div>
              <div className={styles.actionDescription}>Approve and manage user accounts</div>
            </Link>
          )}

          <Link to="/admin/personal-info" className={styles.actionCard}>
            <div className={styles.actionIcon}>⚙️</div>
            <div className={styles.actionTitle}>Profile Settings</div>
            <div className={styles.actionDescription}>Update your profile information</div>
          </Link>
        </div>
      </div>

      {/* Recent Activities */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Recent Activities</h2>
        <div className={styles.activitiesList}>
          {stats.recentActivities.length > 0 ? (
            stats.recentActivities.map((activity) => (
              <div key={activity.id} className={styles.activityCard}>
                <div className={styles.activityInfo}>
                  <h3 className={styles.activityTitle}>{activity.title}</h3>
                  <p className={styles.activityDescription}>
                    {activity.shortDescription || activity.description.substring(0, 100) + '...'}
                  </p>
                  <div className={styles.activityMeta}>
                    <span className={styles.activityLocation}>{activity.location}</span>
                    <span className={`${styles.activityStatus} ${activity.isApproved ? styles.approved : styles.pending}`}>
                      {activity.isApproved ? 'Approved' : 'Pending'}
                    </span>
                  </div>
                </div>
                <div className={styles.activityActions}>
                  <Link 
                    to={`/admin/activities/edit/${activity.id}`}
                    className={styles.editButton}
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📋</div>
              <h3>No activities yet</h3>
              <p>Start by creating your first activity</p>
              <Link to="/admin/activities/new" className={styles.createButton}>
                Create Activity
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;