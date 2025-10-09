import React from 'react';
import styles from './PersonalInfo.module.css';
import MobileHeader from '../../components/MobileHeader';
import { useAuth } from '../../../shared/contexts/AuthContext';

const PersonalInfo: React.FC = () => {
  const { user, signOut } = useAuth();

  return (
    <div className={styles.page}>
      <MobileHeader showBack onBack={() => window.history.back()} />
      <div className={styles.content}>
        <div className={styles.card}>
          <div className={styles.row}>
            <span className={styles.label}>Photo</span>
            <div>
              {user?.photoUrl ? (
                <img className={styles.avatar} src={user.photoUrl} alt={user.fullName || user.email} />
              ) : (
                <span className={styles.value}>No photo</span>
              )}
            </div>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Full name</span>
            <span className={styles.value}>{user?.fullName || '—'}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Email</span>
            <span className={styles.value}>{user?.email || '—'}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Role</span>
            <span className={styles.value}>{user?.role || '—'}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Phone</span>
            <span className={styles.value}>{user?.phone || '—'}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Address</span>
            <span className={styles.value}>{user?.address || '—'}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Organization</span>
            <span className={styles.value}>{user?.organizationName || '—'}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Org. Address</span>
            <span className={styles.value}>{user?.organizationAddress || '—'}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Org. Number</span>
            <span className={styles.value}>{user?.organizationNumber || '—'}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Approved</span>
            <span className={styles.value}>{user?.isApproved ? 'Yes' : 'No'}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Created</span>
            <span className={styles.value}>{user?.createdAt ? new Date(user.createdAt).toLocaleString() : '—'}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.label}>Updated</span>
            <span className={styles.value}>{user?.updatedAt ? new Date(user.updatedAt).toLocaleString() : '—'}</span>
          </div>
        </div>
        <button className={styles.logoutButton} onClick={async () => {
          await signOut();
          window.location.assign('/mobile/cover');
        }}>
          Log out
        </button>
      </div>
    </div>
  );
};

export default PersonalInfo;


