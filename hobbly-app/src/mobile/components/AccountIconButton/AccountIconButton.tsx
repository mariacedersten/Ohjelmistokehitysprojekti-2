import React from 'react';
import { useAuth } from '../../../shared/contexts/AuthContext';

interface Props {
  className?: string;
}

const AccountIconButton: React.FC<Props> = ({ className }) => {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <button
      className={className}
      onClick={() => window.location.assign('/mobile/personalinfo')}
      aria-label="Account"
      style={{
        background: 'transparent',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 6,
        borderRadius: 999,
        cursor: 'pointer'
      }}
    >
      {user.photoUrl ? (
        <img
          src={user.photoUrl}
          alt={user.fullName || user.email}
          style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.8)' }}
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      ) : (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ color: 'white' }}>
          <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2" />
          <path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
};

export default AccountIconButton;


