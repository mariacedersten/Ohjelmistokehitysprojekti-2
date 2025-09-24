import React from 'react';
import styles from './MobileHeader.module.css';
import AccountIconButton from '../AccountIconButton';

interface Props {
  showBack?: boolean;
  onBack?: () => void;
}

const MobileHeader: React.FC<Props> = ({ showBack, onBack }) => {
  return (
    <header className={styles.header}>
      <div className={styles.row}>
        {showBack && (
          <button className={styles.backButton} onClick={onBack} aria-label="Back">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        )}

        <img
          src="/assets/wireframes/Logo Hobbly/logo_white@low-res.png"
          alt="Hobbly"
          className={styles.logo}
        />

        <div className={styles.spacer} />

        <AccountIconButton />
      </div>
    </header>
  );
};

export default MobileHeader;


