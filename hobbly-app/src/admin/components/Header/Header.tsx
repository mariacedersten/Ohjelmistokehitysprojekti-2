/**
 * @fileoverview Admin header component with user avatar and info
 * @module admin/components/Header
 * @description Global header for admin panel showing user information
 */

import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { UserRole } from '../../../types';
import styles from './Header.module.css';

/**
 * Admin Header component with user avatar and info
 * @returns JSX element
 */
const Header: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  /**
   * Get user display name
   */
  const getUserDisplayName = (): string => {
    if (user?.fullName) return user.fullName;
    if (user?.organizationName) return user.organizationName;
    return user?.email?.split('@')[0] || 'User';
  };

  /**
   * Get user role display
   */
  const getUserRoleDisplay = (): string => {
    switch (user?.role) {
      case UserRole.ADMIN:
        return 'Administrator';
      case UserRole.ORGANIZER:
        return 'Organizer';
      default:
        return 'User';
    }
  };

  /**
   * Get user avatar URL or initials
   */
  const getUserAvatar = (): string => {
    if (user?.photoUrl) {
      return user.photoUrl;
    }
    // Generate avatar based on initials
    const initials = getUserDisplayName()
      .split(' ')
      .map(name => name[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=48&background=2D5F5D&color=fff&format=png`;
  };

  /**
   * Get page title based on current route
   */
  const getPageTitle = (): string => {
    const path = location.pathname;

    if (path === '/admin/dashboard') return 'DASHBOARD';
    if (path === '/admin/activities') return 'ACTIVITIES';
    if (path === '/admin/activities/new') return 'NEW ACTIVITY';
    if (path.startsWith('/admin/activities/edit/')) return 'EDIT ACTIVITY';
    if (path === '/admin/activities/trash') return 'RECENTLY DELETED';
    if (path === '/admin/activities/requests') return 'ACTIVITY REQUESTS';
    if (path === '/admin/users') return 'USERS';
    if (path === '/admin/users/requests') return 'USER REQUESTS';
    if (path === '/admin/personal-info') return 'PERSONAL INFO';

    return 'ADMIN PANEL';
  };

  /**
   * Handle avatar click to navigate to profile
   */
  const handleAvatarClick = () => {
    navigate('/admin/personal-info');
  };

  return (
    <header className={styles.header}>
      {/* Page Title */}
      <div className={styles.pageTitle}>
        <h1>{getPageTitle()}</h1>
      </div>

      {/* User Avatar and Info */}
      <div className={styles.userSection}>
        <div className={styles.userInfo}>
          <span className={styles.userName}>{getUserDisplayName()}</span>
          <span className={styles.userRole}>{getUserRoleDisplay()}</span>
        </div>
        <div
          className={`${styles.userAvatar} ${styles.clickableAvatar}`}
          onClick={handleAvatarClick}
          title="Go to profile"
        >
          <img
            src={getUserAvatar()}
            alt={getUserDisplayName()}
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              const initials = getUserDisplayName()
                .split(' ')
                .map(name => name[0])
                .join('')
                .toUpperCase()
                .substring(0, 2);
              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=48&background=2D5F5D&color=fff&format=png`;
            }}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;