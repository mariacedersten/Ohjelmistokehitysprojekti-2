import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './Login.module.css';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { SignInFormData } from '../../../types';

/** Eye Icon for password visibility */
const EyeIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" stroke="currentColor" strokeWidth="2"/>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

/** Eye Off Icon for password visibility */
const EyeOffIcon: React.FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M1 12s4-7 11-7c2.2 0 4.2.6 6 1.5M23 12s-4 7-11 7c-2.2 0-4.2-.6-6-1.5" stroke="currentColor" strokeWidth="2"/>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
    <path d="M2 2l20 20" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const Login: React.FC = () => {
  const { signIn, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<SignInFormData>({
    email: '',
    password: '',
    rememberMe: false
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // 👈 добавлено

  const handleChange = (field: keyof SignInFormData) => (value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError('Please enter both email and password');
      return;
    }
    setLoading(true);
    try {
      await signIn(formData);
      navigate('/mobile/home');
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logoContainer}>
          <img
            src="/assets/wireframes/Logo Hobbly/logo_white@low-res.png"
            alt="Hobbly"
            className={styles.logo}
          />
        </div>
      </header>

      {/* Centered Form */}
      <div className={styles.centerContainer}>
        <h1 className={styles.pageTitle}>Log in</h1>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="email"
            className={styles.input}
            placeholder="Login"
            value={formData.email}
            onChange={e => handleChange('email')(e.target.value)}
          />

          {/* Password with eye toggle */}
          <div className={styles.inputWrap}>
            <input
              type={showPassword ? 'text' : 'password'}
              className={styles.input}
              placeholder="Password"
              value={formData.password}
              onChange={e => handleChange('password')(e.target.value)}
            />
            <button
              type="button"
              className={styles.eyeBtn}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              onClick={() => setShowPassword(v => !v)}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>

          <button
            type="submit"
            className={styles.loginBtn}
            disabled={loading || authLoading}
          >
            {loading || authLoading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <div className={styles.links}>
          <Link to="/mobile/forgot-password" className={styles.link}>
            Forgot login/password?
          </Link>
        </div>
      </div>

      <button
        className={styles.backBtn}
        onClick={() => navigate(-1)}
      >
        BACK
      </button>
    </div>
  );
};

export default Login;




