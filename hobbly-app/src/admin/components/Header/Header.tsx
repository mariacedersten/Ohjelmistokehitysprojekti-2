/**
 * @fileoverview Admin header component with search and user avatar
 * @module admin/components/Header
 * @description Global header for admin panel according to wireframe design
 */

import React, { useState } from 'react';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { UserRole } from '../../../types';
import styles from './Header.module.css';

interface HeaderProps {
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
}

/**
 * Admin Header component with search bar and user avatar
 * @param {HeaderProps} props - Component props
 * @returns JSX element
 */
const Header: React.FC<HeaderProps> = ({
  onSearch,
  searchPlaceholder = "Search..."
}) => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (onSearch) {
      onSearch(query);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

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

  return (
    <header className={styles.header}>
      {/* Search Bar */}
      <form className={styles.searchForm} onSubmit={handleSearchSubmit}>
        <div className={styles.searchContainer}>
          <svg
            className={styles.searchIcon}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="11"
              cy="11"
              r="8"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              d="m21 21-4.35-4.35"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={handleSearchChange}
            className={styles.searchInput}
          />
        </div>
      </form>

      {/* User Avatar and Info */}
      <div className={styles.userSection}>
        <div className={styles.userInfo}>
          <span className={styles.userName}>{getUserDisplayName()}</span>
          <span className={styles.userRole}>{getUserRoleDisplay()}</span>
        </div>
        <div className={styles.userAvatar}>
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