/**
 * @fileoverview Admin sidebar navigation component
 * @module admin/components/Sidebar
 * @description Desktop navigation sidebar for admin panel with role-based menu items
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { UserRole } from '../../../types';
import styles from './Sidebar.module.css';

/**
 * Admin Sidebar navigation component
 * @returns JSX element
 */
const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  
  const isActive = (path: string) => {
    if (path === '/admin/dashboard') {
      return location.pathname === '/admin/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const menuItems = [
    {
      path: '/admin/dashboard',
      label: 'Dashboard',
      icon: '📊',
      roles: [UserRole.ORGANIZER, UserRole.ADMIN]
    },
    {
      path: '/admin/activities',
      label: 'Activities',
      icon: '📋',
      roles: [UserRole.ORGANIZER, UserRole.ADMIN]
    },
    {
      path: '/admin/activities/requests',
      label: 'Activities requests',
      icon: '🔔',
      roles: [UserRole.ADMIN]
    },
    {
      path: '/admin/users',
      label: 'Users',
      icon: '👥',
      roles: [UserRole.ADMIN]
    },
    {
      path: '/admin/users/requests',
      label: 'Users\'s requests',
      icon: '🔔',
      roles: [UserRole.ADMIN]
    },
    {
      path: '/admin/personal-info',
      label: 'Profile',
      icon: '⚙️',
      roles: [UserRole.ORGANIZER, UserRole.ADMIN]
    }
  ];

  const filteredMenuItems = menuItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  return (
    <aside className={styles.sidebar}>
      {/* Logo section */}
      <div className={styles.logoSection}>
        <div className={styles.logoContainer}>
          <div className={styles.logoSymbol}></div>
          <span className={styles.logoText}>Hobbly</span>
        </div>
        <div className={styles.adminBadge}>Admin Panel</div>
      </div>

      {/* Navigation menu */}
      <nav className={styles.navigation}>
        <ul className={styles.menuList}>
          {filteredMenuItems.map((item) => (
            <li key={item.path} className={styles.menuItem}>
              <Link
                to={item.path}
                className={`${styles.menuLink} ${isActive(item.path) ? styles.active : ''}`}
              >
                <span className={styles.menuIcon}>{item.icon}</span>
                <span className={styles.menuLabel}>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* User info and sign out */}
      <div className={styles.userSection}>
        <div className={styles.userInfo}>
          <div className={styles.userAvatar}>
            {user?.fullName?.charAt(0) || user?.email?.charAt(0) || 'U'}
          </div>
          <div className={styles.userDetails}>
            <div className={styles.userName}>
              {user?.fullName || user?.email?.split('@')[0]}
            </div>
            <div className={styles.userRole}>
              {user?.role === UserRole.ADMIN ? 'Administrator' : 'Organizer'}
            </div>
            {user?.organizationName && (
              <div className={styles.organizationName}>
                {user.organizationName}
              </div>
            )}
          </div>
        </div>
        
        <button 
          onClick={handleSignOut}
          className={styles.signOutButton}
          title="Sign out"
        >
          🚪 Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;