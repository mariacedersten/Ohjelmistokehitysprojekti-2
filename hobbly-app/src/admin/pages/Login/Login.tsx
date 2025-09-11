/**
 * @fileoverview Admin login page component - exact wireframe implementation
 * @module admin/pages/Login
 * @description Login page for admin panel following the exact wireframe design
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '../../../shared/components';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { SignInFormData, UserRole } from '../../../types';
import styles from './Login.module.css';

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
    <div className={styles.container}>
      {/* Left side - Dark green with hobby icons pattern */}
      <div className={styles.leftSide}>
        {/* Hobby icons background pattern */}
        <div className={styles.backgroundPattern}></div>
        
        {/* Logo section */}
        <div className={styles.logoSection}>
          <div className={styles.logoContainer}>
            <div className={styles.logoSymbol}></div>
            <span className={styles.logoText}>Hobbly</span>
          </div>
        </div>
        
        {/* Registration prompt at bottom */}
        <div className={styles.registrationSection}>
          <p className={styles.registrationText}>No registration yet?</p>
          <Link to="/admin/signup" className={styles.registrationLink}>
            <button className={styles.registrationButton}>
              Registration
            </button>
          </Link>
        </div>
      </div>

      {/* Right side - White background with login form */}
      <div className={styles.rightSide}>
        <div className={styles.formContainer}>
          <h1 className={styles.formTitle}>Login to your panel</h1>
          
          {error && (
            <div className={styles.errorMessage}>
              {error}
              {user && user.role === UserRole.USER && (
                <div style={{ marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => navigate('/mobile')}
                    style={{
                      backgroundColor: '#073B3A',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    Go to Mobile App
                  </button>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Email field */}
            <div className={styles.inputGroup}>
              <input
                type="email"
                placeholder="E-mail address"
                value={formData.email}
                onChange={(e) => handleInputChange('email')(e.target.value)}
                className={styles.input}
                required
              />
            </div>

            {/* Password field */}
            <div className={styles.inputGroup}>
              <div className={styles.passwordContainer}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password')(e.target.value)}
                  className={styles.input}
                  required
                />
                <button
                  type="button"
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <Icon name="password-hide" size="medium" />
                </button>
              </div>
            </div>

            {/* Remember me checkbox */}
            <div className={styles.checkboxGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={(e) => handleInputChange('rememberMe')(e.target.checked)}
                  className={styles.checkbox}
                />
                <span className={styles.checkboxText}>Remember me</span>
              </label>
            </div>

            {/* Login button */}
            <button
              type="submit"
              disabled={loading || authLoading}
              className={styles.loginButton}
            >
              {loading || authLoading ? 'Logging in...' : 'Login'}
            </button>

            {/* Forgot password link */}
            <Link to="/admin/forgot-password" className={styles.forgotLink}>
              Forgot your password?
            </Link>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;