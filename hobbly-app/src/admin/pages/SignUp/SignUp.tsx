/**
 * @fileoverview Admin SignUp page component
 * @module admin/pages/SignUp
 * @description Registration page for admin/organizer panel
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { SignUpFormData } from '../../../types';

import styles from './SignUp.module.css';

const logo = process.env.PUBLIC_URL + '/Logo Hobbly/logo_primary_1@high-res.png';
const googleIcon = process.env.PUBLIC_URL + '/Icons/google.svg';
const appleIcon = process.env.PUBLIC_URL + '/Icons/apple.svg';
const photoIcon = process.env.PUBLIC_URL + '/Icons/photo.svg';
const defaultAvatar = process.env.PUBLIC_URL + '/Icons/users.svg';


const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [formData, setFormData] = useState<SignUpFormData>({
    fullName: '',
    email: '',
    address: '',
    phone: '',
    password: '',
    confirmPassword: '',
    organizationName: '',
    organizationAddress: '',
    organizationNumber: '',
    photo: undefined,
    agreeToTerms: true, // Terms are agreed by signing up in admin panel
  });
  const [photoPreview, setPhotoPreview] = useState<string>(defaultAvatar);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: boolean}>({});


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Убираем ошибку поля при вводе
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: false }));
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData(prev => ({ ...prev, photo: file }));
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const validatePassword = () => {
    const { password, confirmPassword } = formData;
    
    console.log('🔒 Password validation details:', {
      passwordLength: password.length,
      confirmPasswordLength: confirmPassword.length,
      passwordsMatch: password === confirmPassword
    });

    // Проверяем заполнение обязательных полей
    if (!password) {
      console.log('❌ Password is empty');
      setPasswordError('Password is required.');
      return false;
    }

    if (!confirmPassword) {
      console.log('❌ Confirm password is empty');
      setPasswordError('Please confirm your password.');
      return false;
    }

    // Проверяем сложность пароля по отдельным критериям
    console.log('🔍 Password analysis:', {
      password: password,
      length: password.length,
      hasLetter: /[A-Za-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[@$!%*#?&]/.test(password)
    });
    
    let errorMsg = 'Password must contain: ';
    const issues = [];
    
    if (password.length < 8) issues.push('at least 8 characters');
    if (!/[A-Za-z]/.test(password)) issues.push('at least one letter');
    if (!/\d/.test(password)) issues.push('at least one number');
    if (!/[@$!%*#?&]/.test(password)) issues.push('at least one special symbol (@$!%*#?&)');
    
    if (issues.length > 0) {
      console.log('❌ Password complexity check failed');
      errorMsg += issues.join(', ') + '.';
      console.log('💡 Specific password issues:', issues);
      setPasswordError(errorMsg);
      setFieldErrors(prev => ({ ...prev, password: true, confirmPassword: true }));
      return false;
    }

    // Проверяем совпадение паролей
    if (password !== confirmPassword) {
      console.log('❌ Passwords do not match');
      setPasswordError('Passwords do not match.');
      setFieldErrors(prev => ({ ...prev, password: true, confirmPassword: true }));
      return false;
    }

    console.log('✅ Password validation successful');
    setPasswordError('');
    setFieldErrors(prev => ({ ...prev, password: false, confirmPassword: false }));
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('🚀 handleSubmit called');
    e.preventDefault();
    
    console.log('📝 Form data:', {
      fullName: formData.fullName,
      email: formData.email,
      hasPassword: !!formData.password,
      hasConfirmPassword: !!formData.confirmPassword,
      organizationName: formData.organizationName,
      agreeToTerms: formData.agreeToTerms
    });

    // Сбрасываем ошибки полей
    setFieldErrors({});
    
    // Проверяем заполнение обязательных полей
    console.log('📋 Validating required fields...');
    const errors: {[key: string]: boolean} = {};
    let hasErrors = false;
    
    if (!formData.fullName) {
      console.log('❌ Full name is required');
      errors.fullName = true;
      hasErrors = true;
    }

    if (!formData.email) {
      console.log('❌ Email is required');
      errors.email = true;
      hasErrors = true;
    }

    if (!formData.organizationName) {
      console.log('❌ Organization name is required');
      errors.organizationName = true;
      hasErrors = true;
    }

    if (!formData.organizationAddress) {
      console.log('❌ Organization address is required');
      errors.organizationAddress = true;
      hasErrors = true;
    }

    if (!formData.organizationNumber) {
      console.log('❌ Organization number is required');
      errors.organizationNumber = true;
      hasErrors = true;
    }


    // Простая валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      console.log('❌ Invalid email format');
      errors.email = true;
      hasErrors = true;
    }

    if (hasErrors) {
      setFieldErrors(errors);
      setError('Please fill in all required fields correctly.');
      return;
    }

    console.log('✅ Required fields validation passed');

    // Проверяем валидацию пароля
    console.log('🔒 Validating password...');
    if (!validatePassword()) {
      console.log('❌ Password validation failed');
      return;
    }
    console.log('✅ Password validation passed');
    
    console.log('🔄 Setting loading state...');
    setLoading(true);
    setError('');

    try {
      console.log('📡 Calling signUp API...');
      await signUp(formData);
      console.log('✅ signUp completed successfully');
      
      // Проверяем, сохранился ли токен в localStorage
      console.log('🔑 Checking for auth token...');
      const token = localStorage.getItem('auth_token');
      console.log('Token status:', token ? 'Found' : 'Not found');
      
      if (!token) {
        console.log('⚠️ No token found - showing email confirmation message');
        setError('Registration successful! Please check your email to confirm your account before logging in.');
        // Не перенаправляем на dashboard без токена
        return;
      }
      
      console.log('🎯 Navigating to dashboard...');
      navigate('/admin/dashboard');
    } catch (err: any) {
      console.error('❌ SignUp error:', err);
      console.error('Error details:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
      
      // Проверяем, может ли это быть успешная регистрация без токена
      if (err.message && err.message.includes('access token missing')) {
        console.log('⚠️ Access token missing - treating as successful registration');
        setError('Registration successful! Please check your email to confirm your account before logging in.');
      } else {
        console.log('💥 Setting error message for user');
        setError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      console.log('🏁 Setting loading to false');
      setLoading(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <header className={styles.header}>
        <img src={logo} alt="Hobbly" className={styles.logo} />
      </header>
      <main className={styles.mainContent}>
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Left Column - Personal Info */}
          <div className={styles.column}>
            <input
              type="text"
              name="fullName"
              placeholder="Full name"
              value={formData.fullName}
              onChange={handleInputChange}
              className={`${styles.input} ${fieldErrors.fullName ? styles.inputError : ''}`}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="E-mail address"
              value={formData.email}
              onChange={handleInputChange}
              className={`${styles.input} ${fieldErrors.email ? styles.inputError : ''}`}
              required
            />
            <input
              type="text"
              name="address"
              placeholder="Address"
              value={formData.address}
              onChange={handleInputChange}
              className={`${styles.input} ${fieldErrors.address ? styles.inputError : ''}`}
            />
            <input
              type="tel"
              name="phone"
              placeholder="Phone number"
              value={formData.phone}
              onChange={handleInputChange}
              className={`${styles.input} ${fieldErrors.phone ? styles.inputError : ''}`}
            />
            <input
              type="password"
              name="password"
              placeholder="Create password"
              value={formData.password}
              onChange={handleInputChange}
              className={`${styles.input} ${fieldErrors.password ? styles.inputError : ''}`}
              required
            />
            <input
              type="password"
              name="confirmPassword"
              placeholder="Repeat password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              className={`${styles.input} ${fieldErrors.confirmPassword ? styles.inputError : ''}`}
              required
            />
          </div>

          {/* Middle Column - Organization Info */}
          <div className={styles.column}>
            <input
              type="text"
              name="organizationName"
              placeholder="Organisation name"
              value={formData.organizationName}
              onChange={handleInputChange}
              className={`${styles.input} ${fieldErrors.organizationName ? styles.inputError : ''}`}
              required
            />
            <input
              type="text"
              name="organizationAddress"
              placeholder="Organisation address"
              value={formData.organizationAddress}
              onChange={handleInputChange}
              className={`${styles.input} ${fieldErrors.organizationAddress ? styles.inputError : ''}`}
              required
            />
            <input
              type="text"
              name="organizationNumber"
              placeholder="Organisation number"
              value={formData.organizationNumber}
              onChange={handleInputChange}
              className={`${styles.input} ${fieldErrors.organizationNumber ? styles.inputError : ''}`}
              required
            />

            <div className={styles.actions}>
              <button type="submit" className={styles.signUpButton} disabled={loading}>
                {loading ? '🔄 Signing up...' : 'Sign up'}
              </button>
              {loading && (
                <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
                  Please wait, processing your registration...
                </div>
              )}
              <p className={styles.socialLoginText}>Or log in with</p>
              <div className={styles.socialButtons}>
                <button type="button" className={styles.socialButton}><img src={googleIcon} alt="Google" /></button>
                <button type="button" className={styles.socialButton}><img src={appleIcon} alt="Apple" /></button>
              </div>
            </div>
          </div>

          {/* Right Column - Photo Upload */}
          <div className={styles.rightSection}>
            <h1 className={styles.pageTitle}>SIGN UP</h1>
            <div className={styles.photoUpload}>
              <p>Add photo</p>
              <div className={styles.avatarContainer}>
                <img src={photoPreview} alt="Avatar preview" className={styles.avatarPreview} />
                <label htmlFor="photo-upload" className={styles.photoUploadButton}>
                  <img src={photoIcon} alt="Upload" />
                </label>
                <input id="photo-upload" type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
              </div>
            </div>
          </div>
        </form>
        {passwordError && <p className={styles.passwordRequirement} style={{color: '#ff4444'}}>{passwordError}</p>}
        {!passwordError && <p className={styles.passwordRequirement}>The password must contain at least 8 characters, one number and special symbols (@$!%*#?&).</p>}
        {error && <p className={styles.error}>{error}</p>}
      </main>
      <footer className={styles.footer}>
        © Hobbly Technologies Oy
      </footer>
    </div>
  );
};

export default SignUp;
