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

const ADMIN_LOGO_URL = "https://jourvbtxuyavamxvddwc.supabase.co/storage/v1/object/public/activities/Logo%20Hobbly/logo_white@high-res.png";

/**
 * Admin Sidebar navigation component
 * @returns JSX element
 */
const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  
  const isActive = (path: string) => location.pathname === path;

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
      iconSrc: 'https://jourvbtxuyavamxvddwc.supabase.co/storage/v1/object/public/activities/Icons/Dashbord.svg',
      roles: [UserRole.ADMIN]
    },
    {
      path: '/admin/activities',
      label: 'Activities',
      iconSrc: 'https://jourvbtxuyavamxvddwc.supabase.co/storage/v1/object/public/activities/Icons/activities.svg',
      roles: [UserRole.ORGANIZER, UserRole.ADMIN]
    },
    {
      path: '/admin/activities/requests',
      label: 'Activities requests',
      iconSrc: 'https://jourvbtxuyavamxvddwc.supabase.co/storage/v1/object/public/activities/Icons/bell.svg',
      roles: [UserRole.ADMIN]
    },
    {
      path: '/admin/users',
      label: 'Users',
      iconSrc: 'https://jourvbtxuyavamxvddwc.supabase.co/storage/v1/object/public/activities/Icons/users.svg',
      roles: [UserRole.ADMIN]
    },
    {
      path: '/admin/users/requests',
      label: "Users's requests",
      iconSrc: 'https://jourvbtxuyavamxvddwc.supabase.co/storage/v1/object/public/activities/Icons/bell.svg',
      roles: [UserRole.ADMIN]
    },
    {
      path: '/admin/personal-info',
      label: 'Profile',
      iconSrc: 'https://jourvbtxuyavamxvddwc.supabase.co/storage/v1/object/public/activities/Icons/settings.svg',
      roles: [UserRole.ORGANIZER, UserRole.ADMIN]
    }
  ];

  const filteredMenuItems = menuItems.filter(item => user && item.roles.includes(user.role));

  const sidebarBgStyle: React.CSSProperties = {
    backgroundImage: "url('https://jourvbtxuyavamxvddwc.supabase.co/storage/v1/object/public/activities/Desktop/bg_pattern.png')",
    backgroundRepeat: 'repeat',
    backgroundSize: '2000px auto',
    backgroundPosition: 'top left'
  };

  return (
    <aside className={styles.sidebar} style={sidebarBgStyle}>
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
                <span className={styles.menuIcon}>
                  <img src={item.iconSrc} alt="" className={styles.menuIconImage} />
                </span>
                <span className={styles.menuLabel}>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom navigation (Trash bin) */}
      {user && (user.role === UserRole.ADMIN || user.role === UserRole.ORGANIZER) && (
        <div className={styles.bottomNav}>
          <Link
            to="/admin/activities/trash"
            className={`${styles.menuLink} ${isActive('/admin/activities/trash') ? styles.active : ''}`}
          >
            <span className={styles.menuIcon}>
              <img
                src="https://jourvbtxuyavamxvddwc.supabase.co/storage/v1/object/public/activities/Icons/trashbin.svg"
                alt=""
                className={styles.menuIconImage}
              />
            </span>
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
