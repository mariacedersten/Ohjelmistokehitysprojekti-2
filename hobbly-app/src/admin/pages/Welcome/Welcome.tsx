/**
 * @fileoverview Admin Welcome (Landing) page
 * @module admin/pages/Welcome
 * @description Desktop-first landing page that mirrors the mock
 */

import React, { useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { UserRole } from '../../../types';
import styles from './Welcome.module.css';
const ADMIN_LOGO_URL = `${process.env.PUBLIC_URL}/Logo Hobbly/logo_white@high-res.png`;

/**
 * Right-side illustration from public folder
 */
const ILLUSTRATION_URL = `${process.env.PUBLIC_URL}/Landing%20Page.jpeg`;

const Welcome: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Background pattern encoded SVG, consistent with Login page style
  const bgPattern = useMemo(() => {
    const svg = encodeURIComponent(`
      <svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'>
        <g fill='none' stroke='#65FF81' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round' opacity='0.30'>
          <path d='M10 11l2.3 4.7 5.2.7-3.7 3.6.9 5.1-4.7-2.5-4.7 2.5.9-5.1L3 16.4l5.2-.7z'/>
          <path d='M43 9c2.1-2.1 5.6-2.1 7.7 0 2.1 2.1 2.1 5.6 0 7.7L50 18.4l-7-7c-1.9-1.9-1.9-5 0-6.9z'/>
          <path d='M36 44h-8M25 41v6M39 41v6M22 41h6M36 41h6'/>
          <path d='M9 46c0-4 3.2-7.2 7.2-7.2h6.6c4 0 7.2 3.2 7.2 7.2s-3.2 7.2-7.2 7.2H19l-4.6 3.5.9-3.5C11.1 53.2 9 49.9 9 46z'/>
          <path d='M48 31c-3 0-5.5-2.5-5.5-5.5V19h11v6.5C53.5 28.5 51 31 48 31zM43 19v-3h10v3M48 31v4M44 35h8'/>
        </g>
      </svg>
    `);
    return `url("data:image/svg+xml,${svg}")`;
  }, []);

  // Redirect authenticated organizers/admins straight to dashboard
  useEffect(() => {
    if (!loading && user && (user.role === UserRole.ADMIN || user.role === UserRole.ORGANIZER)) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  return (
    <div className={styles.pageRoot} style={{ backgroundImage: bgPattern, backgroundSize: '56px 56px' }}>
      <section className={styles.brand}>
        <h2 className={styles.welcome}>Welcome to our web-page!</h2>

        <div className={styles.logoRow}>
          <img src={ADMIN_LOGO_URL} alt="Hobbly" className={styles.brandLogo} />
        </div>
        <div className={styles.brandSubtitle}>Technologies Oy</div>

        <div className={styles.ctaGrid}>
          <div className={styles.ctaCard}>
            <div className={styles.ctaCaption}>Not a user yet?</div>
            <Link to="/admin/signup">
              <button className={styles.ctaButton} type="button">Sign up</button>
            </Link>
          </div>
          <div className={styles.ctaCard}>
            <div className={styles.ctaCaption}>Already have an account?</div>
            <Link to="/admin/login">
              <button className={styles.ctaButton} type="button">Sign in</button>
            </Link>
          </div>
        </div>
      </section>

      <aside className={styles.sideImageWrap} aria-hidden="true">
        <img className={styles.sideImage} src={ILLUSTRATION_URL} alt="" />
      </aside>
    </div>
  );
};

export default Welcome;


