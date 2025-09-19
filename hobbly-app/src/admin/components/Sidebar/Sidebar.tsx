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
const ADMIN_LOGO_URL = `${process.env.PUBLIC_URL}/Logo Hobbly/logo_white@high-res.png`;

/**
 * Admin Sidebar navigation componentяы
 * @returns JSX element
 */
const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  
  const isActive = (path: string) => {
    // Exact match for all paths to avoid conflicts
    return location.pathname === path;
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
      roles: [UserRole.ADMIN]
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
          <img src={ADMIN_LOGO_URL} alt="Hobbly" className={styles.logoImage} />
        </div>
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

      {/* Bottom navigation (Trash bin) to match design */}
      {user && (user.role === UserRole.ADMIN || user.role === UserRole.ORGANIZER) && (
        <div className={styles.bottomNav}>
          <Link
            to="/admin/activities/trash"
            className={`${styles.menuLink} ${isActive('/admin/activities/trash') ? styles.active : ''}`}
          >
            <span className={styles.menuIcon}>🗑️</span>
            <span className={styles.menuLabel}>Trash bin</span>
          </Link>
        </div>
      )}

      {/* Sign out button */}
      <div className={styles.userSection}>
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
