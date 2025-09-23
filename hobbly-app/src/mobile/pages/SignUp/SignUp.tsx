import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './SignUp.module.css';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { SignUpFormData } from '../../../types';

const SignUp: React.FC = () => {
  const { signUp, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<SignUpFormData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: true, // для мобильного сразу true
    role: 'user',       // автоматически присваиваем роль 'user'
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof SignUpFormData) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { fullName, email, password, confirmPassword } = formData;

    if (!fullName || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8 || !/\d/.test(password) || !/[@$!%*#?&]/.test(password)) {
      setError('Password must have 8+ chars, a number and a special symbol');
      return;
    }

    setLoading(true);
    try {
      await signUp(formData); // роль уже в formData
      navigate('/mobile/home');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <img
          src="/assets/wireframes/Logo Hobbly/logo_white@low-res.png"
          alt="Hobbly"
          className={styles.logo}
        />
      </header>

      <main className={styles.center}>
        <h1 className={styles.pageTitle}>Sign up</h1>
        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <input
            type="text"
            placeholder="Full name"
            className={styles.input}
            value={formData.fullName}
            onChange={e => handleChange('fullName')(e.target.value)}
          />
          <input
            type="email"
            placeholder="E-mail address"
            className={styles.input}
            value={formData.email}
            onChange={e => handleChange('email')(e.target.value)}
          />
          <input
            type="password"
            placeholder="Create password"
            className={styles.input}
            value={formData.password}
            onChange={e => handleChange('password')(e.target.value)}
          />
          <input
            type="password"
            placeholder="Repeat password"
            className={styles.input}
            value={formData.confirmPassword}
            onChange={e => handleChange('confirmPassword')(e.target.value)}
          />
          <button
            type="submit"
            className={styles.signUpBtn}
            disabled={loading || authLoading}
          >
            {loading || authLoading ? 'Signing up…' : 'Sign up'}
          </button>
        </form>

        <p className={styles.requirements}>
          The password must contain at least 8 characters, one number
          and special symbols (@$!%*#?&).
        </p>
      </main>

      <button className={styles.backBtn} onClick={() => navigate(-1)}>
        BACK
      </button>
    </div>
  );
};

export default SignUp;





