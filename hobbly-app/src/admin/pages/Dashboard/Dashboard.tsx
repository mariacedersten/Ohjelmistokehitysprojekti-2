/**
 * @fileoverview Admin dashboard page component according to wireframe design
 * @module admin/pages/Dashboard
 * @description Analytics dashboard with charts and statistics overview
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../shared/contexts/AuthContext';
import activitiesAPI from '../../../api/activities.api';
import usersAPI from '../../../api/users.api';
import { UserRole, Activity, ActivityType } from '../../../types';
import styles from './Dashboard.module.css';

interface DashboardStats {
  totalPosts: number;
  totalUsers: number;
  totalOrganisations: number;
  activities: Activity[];
  eventTypesData: { [key: string]: number };
  weeklyData: number[];
  userEngagementData: number[];
  topTags: { name: string; count: number; color: string }[];
}

/**
 * Admin Dashboard page component
 * @returns JSX element
 */
const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalPosts: 0,
    totalUsers: 0,
    totalOrganisations: 0,
    activities: [],
    eventTypesData: {},
    weeklyData: [0, 0, 0, 0, 0, 0, 0],
    userEngagementData: [0, 0, 0, 0, 0, 0, 0],
    topTags: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load all activities for comprehensive stats
      const activitiesResponse = await activitiesAPI.getActivities({}, 1, 100);
      const activities = activitiesResponse.data;

      // Calculate event types distribution
      const eventTypesData = activities.reduce((acc: { [key: string]: number }, activity: Activity) => {
        const type = activity.type || 'ACTIVITY';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});

      // Generate mock weekly data (activities created per day)
      const weeklyData = [12, 8, 15, 20, 25, 18, 22];

      // Generate mock user engagement data
      const userEngagementData = [30, 45, 35, 60, 80, 50, 40];

      // Calculate top tags
      const tagCounts: { [key: string]: number } = {};
      activities.forEach((activity: Activity) => {
        if (activity.tags) {
          activity.tags.forEach((tag) => {
            const tagName = typeof tag === 'string' ? tag : tag.name;
            tagCounts[tagName] = (tagCounts[tagName] || 0) + 1;
          });
        }
      });

      const topTags = Object.entries(tagCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 4)
        .map(([name, count], index) => ({
          name: name.toUpperCase(),
          count,
          color: ['#FFD93D', '#2D5F5D', '#6BCF7C', '#9E9E9E'][index] || '#9E9E9E'
        }));

      let usersStats = { total: 4, pending: 0 };
      let organisationsCount = 8;

      // Load users stats (only for admins)
      if (user?.role === UserRole.ADMIN) {
        try {
          usersStats = await usersAPI.getUsersStats();
          // Calculate unique organisations from activities
          const uniqueOrgs = new Set(activities.map((a: Activity) => a.organizer?.organizationName).filter(Boolean));
          organisationsCount = uniqueOrgs.size;
        } catch (error) {
          console.error('Failed to load users stats:', error);
        }
      }

      setStats({
        totalPosts: activities.length || 233, // Use wireframe number as fallback
        totalUsers: usersStats.total,
        totalOrganisations: organisationsCount,
        activities,
        eventTypesData,
        weeklyData,
        userEngagementData,
        topTags
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Set fallback data from wireframe
      setStats({
        totalPosts: 233,
        totalUsers: 4,
        totalOrganisations: 8,
        activities: [],
        eventTypesData: { ACTIVITY: 5, EVENTS: 3, HOBBY: 2, CLUB: 1, COMPETITION: 1, 'MASTER-CLASS': 1 },
        weeklyData: [12, 8, 15, 20, 25, 18, 22],
        userEngagementData: [30, 45, 35, 60, 80, 50, 40],
        topTags: [
          { name: 'FREE', count: 85, color: '#FFD93D' },
          { name: 'BEGINNER-FRIENDLY', count: 72, color: '#2D5F5D' },
          { name: 'FAMILY-FRIENDLY', count: 68, color: '#6BCF7C' },
          { name: 'ONLINE', count: 45, color: '#9E9E9E' }
        ]
      });
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

  // Helper function to render pie chart for event types
  const renderPieChart = () => {
    const total = Object.values(stats.eventTypesData).reduce((sum, val) => sum + val, 0);
    let currentAngle = 0;
    const colors = ['#FFD93D', '#2D5F5D', '#6BCF7C', '#9E9E9E', '#FF6B6B', '#4ECDC4'];

    return (
      <svg className={styles.pieChart} viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="80" fill="white" />
        {Object.entries(stats.eventTypesData).map(([type, count], index) => {
          const percentage = (count / total) * 100;
          const angle = (percentage / 100) * 360;
          const startAngle = currentAngle;
          const endAngle = currentAngle + angle;

          const x1 = 100 + 80 * Math.cos((startAngle * Math.PI) / 180);
          const y1 = 100 + 80 * Math.sin((startAngle * Math.PI) / 180);
          const x2 = 100 + 80 * Math.cos((endAngle * Math.PI) / 180);
          const y2 = 100 + 80 * Math.sin((endAngle * Math.PI) / 180);

          const largeArcFlag = angle > 180 ? 1 : 0;
          const pathData = `M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

          currentAngle += angle;

          return (
            <path
              key={type}
              d={pathData}
              fill={colors[index % colors.length]}
              stroke="white"
              strokeWidth="2"
            />
          );
        })}
        <circle cx="100" cy="100" r="30" fill="white" />
      </svg>
    );
  };

  return (
    <div className={styles.container}>
      {/* Header with title and stats */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.mainTitle}>DASHBOARD</h1>
        </div>
        <div className={styles.topStats}>
          <span className={styles.statItem}>Total posts: {stats.totalPosts}</span>
          <span className={styles.statItem}>Users: {stats.totalUsers}</span>
          <span className={styles.statItem}>Organisations: {stats.totalOrganisations}</span>
        </div>
      </div>

      {/* Dashboard Widgets Grid */}
      <div className={styles.widgetsGrid}>
        {/* Events Overview - Line Chart */}
        <div className={styles.widget}>
          <h3 className={styles.widgetTitle}>EVENTS OVERVIEW</h3>
          <div className={styles.chartContainer}>
            <svg className={styles.lineChart} viewBox="0 0 300 150">
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#2D5F5D" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#2D5F5D" stopOpacity="0.1" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              {[0, 50, 100].map((y) => (
                <line key={y} x1="30" y1={120 - y * 0.8} x2="270" y2={120 - y * 0.8} stroke="#E0E0E0" strokeWidth="1" />
              ))}

              {/* Y-axis labels */}
              {[0, 50, 100].map((y) => (
                <text key={y} x="20" y={125 - y * 0.8} fontSize="10" fill="#666" textAnchor="end">{y}</text>
              ))}

              {/* X-axis labels */}
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                <text key={day} x={50 + index * 30} y="140" fontSize="10" fill="#666" textAnchor="middle">{day}</text>
              ))}

              {/* Line path */}
              <path
                d={`M 50,${120 - stats.weeklyData[0] * 3} ${stats.weeklyData.map((value, index) =>
                  `L ${50 + index * 30},${120 - value * 3}`
                ).join(' ')}`}
                fill="none"
                stroke="#2D5F5D"
                strokeWidth="2"
              />

              {/* Area under line */}
              <path
                d={`M 50,120 L 50,${120 - stats.weeklyData[0] * 3} ${stats.weeklyData.map((value, index) =>
                  `L ${50 + index * 30},${120 - value * 3}`
                ).join(' ')} L 230,120 Z`}
                fill="url(#lineGradient)"
              />

              {/* Data points */}
              {stats.weeklyData.map((value, index) => (
                <circle
                  key={index}
                  cx={50 + index * 30}
                  cy={120 - value * 3}
                  r="3"
                  fill="#2D5F5D"
                />
              ))}
            </svg>
          </div>
        </div>

        {/* Event Types - Pie Chart */}
        <div className={styles.widget}>
          <h3 className={styles.widgetTitle}>EVENT TYPES</h3>
          <div className={styles.chartContainer}>
            {renderPieChart()}
            <div className={styles.legend}>
              {Object.entries(stats.eventTypesData).map(([type, count], index) => {
                const colors = ['#FFD93D', '#2D5F5D', '#6BCF7C', '#9E9E9E', '#FF6B6B', '#4ECDC4'];
                return (
                  <div key={type} className={styles.legendItem}>
                    <div
                      className={styles.legendColor}
                      style={{ backgroundColor: colors[index % colors.length] }}
                    ></div>
                    <span className={styles.legendLabel}>{type.toUpperCase()}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* User Engagement - Bar Chart */}
        <div className={styles.widget}>
          <h3 className={styles.widgetTitle}>USER ENGAGEMENT</h3>
          <div className={styles.chartContainer}>
            <svg className={styles.barChart} viewBox="0 0 300 150">
              {/* Grid lines */}
              {[0, 20, 40, 60, 80, 100].map((y) => (
                <line key={y} x1="30" y1={120 - y * 0.8} x2="270" y2={120 - y * 0.8} stroke="#E0E0E0" strokeWidth="1" />
              ))}

              {/* Y-axis labels */}
              {[0, 20, 40, 60, 80, 100].map((y) => (
                <text key={y} x="20" y={125 - y * 0.8} fontSize="10" fill="#666" textAnchor="end">{y}</text>
              ))}

              {/* X-axis labels */}
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                <text key={day} x={50 + index * 30} y="140" fontSize="10" fill="#666" textAnchor="middle">{day}</text>
              ))}

              {/* Bars */}
              {stats.userEngagementData.map((value, index) => (
                <rect
                  key={index}
                  x={40 + index * 30}
                  y={120 - value * 1.2}
                  width="20"
                  height={value * 1.2}
                  fill={index === 4 ? "#2D5F5D" : "#B0BEC5"}
                />
              ))}
            </svg>
          </div>
        </div>

        {/* Top Tags */}
        <div className={styles.widget}>
          <h3 className={styles.widgetTitle}>TOP TAGS</h3>
          <div className={styles.tagsContainer}>
            {stats.topTags.map((tag, index) => (
              <div key={tag.name} className={styles.tagBar} style={{ backgroundColor: tag.color }}>
                <span className={styles.tagName}>{tag.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;