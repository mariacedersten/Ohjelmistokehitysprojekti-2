/**
 * @fileoverview Admin login page component - modern Hobbly design implementation
 * @module admin/pages/Login
 * @description Login page for admin panel with modern Hobbly branding and design
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { SignInFormData, UserRole } from '../../../types';
const ADMIN_LOGO_URL = `${process.env.PUBLIC_URL}/Logo Hobbly/logo_white@high-res.png`;

 

/**
 * Eye Icon for password visibility
 */
const EyeIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke="currentColor" strokeWidth="2" fill="none"/>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
  </svg>
);

/**
 * Eye Off Icon for password visibility
 */
const EyeOffIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M1 12s4-7 11-7c2.2 0 4.2.6 6 1.5M23 12s-4 7-11 7c-2.2 0-4.2-.6-6-1.5" stroke="currentColor" strokeWidth="2" fill="none"/>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M2 2l20 20" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

/**
 * Admin Login page component
 * @returns JSX element
 */
const Login: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, user, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState<SignInFormData>({
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Background pattern for page
  const bgPattern = useMemo(() => {
    const svg = encodeURIComponent(`
      <svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'>
        <g fill='none' stroke='#67C38A' stroke-width='1.7' stroke-linecap='round' stroke-linejoin='round' opacity='0.35'>
          <!-- star -->
          <path d='M10 11l2.3 4.7 5.2.7-3.7 3.6.9 5.1-4.7-2.5-4.7 2.5.9-5.1L3 16.4l5.2-.7z'/>
          <!-- heart -->
          <path d='M43 9c2.1-2.1 5.6-2.1 7.7 0 2.1 2.1 2.1 5.6 0 7.7L50 18.4l-7-7c-1.9-1.9-1.9-5 0-6.9z'/>
          <!-- dumbbell -->
          <path d='M36 44h-8M25 41v6M39 41v6M22 41h6M36 41h6'/>
          <!-- chat bubble -->
          <path d='M9 46c0-4 3.2-7.2 7.2-7.2h6.6c4 0 7.2 3.2 7.2 7.2s-3.2 7.2-7.2 7.2H19l-4.6 3.5.9-3.5C11.1 53.2 9 49.9 9 46z'/>
          <!-- trophy -->
          <path d='M48 31c-3 0-5.5-2.5-5.5-5.5V19h11v6.5C53.5 28.5 51 31 48 31zM43 19v-3h10v3M48 31v4M44 35h8'/>
        </g>
      </svg>
    `);
    return `url("data:image/svg+xml,${svg}")`;
  }, []);

  // Redirect if already logged in with proper role
  useEffect(() => {
    if (user && !authLoading) {
      console.log('Login.tsx - User login check:', { 
        role: user.role, 
        roleType: typeof user.role,
        userFullData: user 
      });
      // Only redirect if user has admin/organizer role
      if (user.role === UserRole.ADMIN || user.role === UserRole.ORGANIZER) {
        navigate('/admin/dashboard');
      } else {
        // User with 'user' role trying to access admin panel
        setError(`Access denied. Admin panel requires organizer or administrator privileges. Your role: ${user.role}. Please use the mobile app instead.`);
      }
    }
  }, [user, authLoading, navigate]);

  const handleInputChange = (field: keyof SignInFormData) => (value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signIn(formData);
      // Navigation will be handled by useEffect when user state updates
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="page-root">
        {/* Brand section (left side) */}
        <div className="brand">
          <div className="brand-row">
            <img src={ADMIN_LOGO_URL} alt="Hobbly" className="logo" />
        </div>
        
          <div className="cta">
            <p className="cta-caption">No registration yet?</p>
            <Link to="/admin/signup">
              <button className="cta-btn" type="button">Registration</button>
          </Link>
        </div>
      </div>

        {/* Card section (right side) */}
        <div className="card">
          <h1 className="card-title">Login to your panel</h1>

          {error && (
            <div className="error-message">
              {error}
              {user && user.role === UserRole.USER && (
                <div style={{ marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => navigate('/mobile')}
                    className="mobile-app-btn"
                  >
                    Go to Mobile App
                  </button>
                </div>
              )}
            </div>
          )}

          <form className="form" onSubmit={handleSubmit}>
            {/* Email */}
            <label className="input-wrap">
              <span className="visually-hidden">E-mail address</span>
              <input
                className="input"
                type="email"
                placeholder="E-mail address"
                value={formData.email}
                onChange={(e) => handleInputChange('email')(e.target.value)}
                required
              />
            </label>

            {/* Password with eye toggle */}
            <label className="input-wrap">
              <span className="visually-hidden">Password</span>
                <input
                className="input"
                type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password')(e.target.value)}
                  required
                />
                <button
                  type="button"
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="eye-btn"
                onClick={() => setShowPassword((v) => !v)}
                >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
            </label>

            {/* Remember me */}
            <label className="remember">
                <input
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={(e) => handleInputChange('rememberMe')(e.target.checked)}
                />
              <span>Remember me</span>
              </label>

            <button className="login-btn" type="submit" disabled={loading || authLoading}>
              {loading || authLoading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <Link to="/admin/forgot-password">
            <button className="forgot" type="button">Forgot your password?</button>
          </Link>
        </div>
      </div>

      {/* Modern CSS Styles aligned to the mock */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Kanit:wght@600;700&family=Montserrat:wght@400;500;600&display=swap');

        :root {
          --bg-deep: #073B3A;        /* closer to mock */
          --mint: #67C38A;           
          --mint-strong: #33D16F;    
          --card: #ffffff;
          --text: #0b2f2a;
          --muted: #809490;          /* placeholder tone closer to mock */
          --field: #F6F8F7;
          --field-border: #E5EEEA;
          --shadow-strong: 0 24px 64px rgba(0,0,0,.22), 0 2px 8px rgba(0,0,0,.08);
          --radius: 24px;
          --error: #dc3545;
        }

        * { box-sizing: border-box; }
        html, body, #root { height: 100%; }

        .page-root {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr minmax(420px, 520px);
          gap: 40px;
          align-items: center;
          padding: 40px clamp(24px, 5vw, 64px);
          background-color: var(--bg-deep);
          background-image: ${bgPattern};
          background-size: 56px 56px;
          color: #fff;
          font-family: 'Montserrat', system-ui, -apple-system, Segoe UI, Roboto, 'Helvetica Neue', Arial, 'Noto Sans', 'Apple Color Emoji', 'Segoe UI Emoji';
        }

        /* Brand (left) */
        .brand { align-self: stretch; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
        .brand-row { display: flex; align-items: center; justify-content: center; }
        .logo { width: clamp(360px, 44vw, 600px); height: auto; display: block; }
        .cta { margin-top: clamp(28px, 8vh, 120px); display: flex; flex-direction: column; align-items: center; gap: 10px; }
        .cta-caption { margin: 0; color: rgba(255,255,255,.9); font-size: 16px; }
        .cta a { text-decoration: none; }
        .cta-btn {
          appearance: none; border: none; cursor: pointer; font-weight: 700;
          font-size: 16px; padding: 12px 22px; border-radius: 12px;
          background: var(--mint-strong); color: #083A2F; transition: transform .06s ease, box-shadow .2s ease; 
          box-shadow: 0 8px 24px rgba(51, 209, 111, .45);
        }
        .cta-btn:hover { transform: translateY(-1px); }
        .cta-btn:active { transform: translateY(0); }

        /* Card (right) */
        .card {
          background: var(--card); color: var(--text); border-radius: var(--radius);
          box-shadow: var(--shadow-strong); padding: clamp(28px, 6vh, 44px) clamp(24px, 4vw, 48px);
          border: 1px solid var(--field-border);
          width: 100%; justify-self: end;
        }
        .card-title {
          margin: 0 0 24px; font-weight: 800; letter-spacing: .2px; text-align: left;
          color: #0e4a43; font-size: 24px;
        }

        .error-message {
          background: #fee; border: 1px solid #fcc; color: var(--error); padding: 12px; border-radius: 10px; margin-bottom: 16px; font-size: 14px;
        }
        
        .mobile-app-btn {
          background-color: #073B3A; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px;
        }

        .form { display: grid; gap: 16px; margin-top: 6px; }
        .input-wrap { position: relative; }
        .input {
          width: 100%; font-size: 16px; padding: 16px 52px 16px 16px; border-radius: 14px;
          outline: none; border: 1px solid var(--field-border); background: var(--field);
          color: #1d2725; transition: box-shadow .15s ease, border-color .15s ease;
          box-shadow: inset 0 1px 2px rgba(0,0,0,.05);
        }
        .input::placeholder { color: var(--muted); opacity: .9; }
        .input:focus { border-color: #a6d6c7; box-shadow: 0 0 0 4px rgba(51, 209, 111, .15); }

        .eye-btn {
          position: absolute; top: 50%; right: 10px; transform: translateY(-50%);
          width: 36px; height: 36px; border-radius: 999px;
          display: inline-flex; align-items: center; justify-content: center;
          border: 1px solid var(--field-border); background: #fff; padding: 0; cursor: pointer; color: #7d908c;
          box-shadow: 0 1px 2px rgba(0,0,0,.06);
        }
        .eye-btn:hover { color: #3d5b54; }

        .remember { display: inline-flex; align-items: center; gap: 10px; margin: 4px 0 8px; color: #2b3a37; }
        .remember input {
          width: 18px; height: 18px; accent-color: #0f3c35; border-radius: 4px; cursor: pointer;
        }
        .remember span { font-size: 16px; cursor: pointer; }

        .login-btn {
          margin: 8px auto 0; width: 220px; display: block; border: none; border-radius: 12px; cursor: pointer;
          background: #0f3c35; color: #fff; font-weight: 700; font-size: 18px; padding: 14px 18px;
          box-shadow: 0 10px 24px rgba(15,60,53,.25); transition: transform .06s ease, filter .2s ease;
        }
        .login-btn:hover:not(:disabled) { filter: brightness(1.05); transform: translateY(-1px); }
        .login-btn:active:not(:disabled) { transform: translateY(0); }
        .login-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        .forgot {
          margin-top: 18px; appearance: none; border: none; background: transparent; color: #0f7160; font-weight: 600; cursor: pointer; display: block; width: 100%; text-align: left; text-decoration: none;
        }
        .forgot:hover { text-decoration: underline; }

        .visually-hidden { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }

        @media (max-width: 980px) {
          .page-root { grid-template-columns: 1fr; padding: 28px 20px 44px; }
          .brand { align-items: center; text-align: center; }
          .brand-row { justify-content: center; }
          .logo { width: clamp(220px, 60vw, 420px); }
          .card { justify-self: center; max-width: 560px; }
          .cta { justify-content: center; }
        }
      `}</style>
    </>
  );
};

export default Login;
