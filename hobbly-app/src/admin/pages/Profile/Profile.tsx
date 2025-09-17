/**
 * @fileoverview Personal Info/Profile page for admin panel
 * @module admin/pages/Profile
 * @description User profile management with personal and organization data
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { User } from '../../../types';
import styles from './Profile.module.css';

interface ProfileFormData {
  fullName: string;
  email: string;
  address: string;
  phone: string;
  organizationName: string;
  organizationAddress: string;
  organizationNumber: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Personal Info/Profile page component
 * @returns JSX element
 */
const Profile: React.FC = () => {
  const { user, updateProfile, changePassword, signOut } = useAuth();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState<ProfileFormData>({
    fullName: '',
    email: '',
    address: '',
    phone: '',
    organizationName: '',
    organizationAddress: '',
    organizationNumber: ''
  });

  const [passwordData, setPasswordData] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Load user data on mount
  useEffect(() => {
    if (user) {
      setProfileData({
        fullName: user.fullName || '',
        email: user.email,
        address: user.address || '',
        phone: user.phone || '',
        organizationName: user.organizationName || '',
        organizationAddress: user.organizationAddress || '',
        organizationNumber: user.organizationNumber || ''
      });
      setProfileImage(user.profilePhotoUrl || '');
    }
  }, [user]);

  /**
   * Handle profile form input changes
   */
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear success message when user starts typing
    if (profileSuccess) setProfileSuccess(null);
  };

  /**
   * Handle password form input changes
   */
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear success message when user starts typing
    if (passwordSuccess) setPasswordSuccess(null);
  };

  /**
   * Handle profile image selection
   */
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  /**
   * Handle profile form submission
   */
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError(null);

    try {
      await updateProfile(profileData);
      setProfileSuccess('Profile updated successfully!');
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setProfileError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setProfileLoading(false);
    }
  };

  /**
   * Handle password form submission
   */
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError(null);

    // Validate password match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match.');
      setPasswordLoading(false);
      return;
    }

    // Validate password strength
    if (passwordData.newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long.');
      setPasswordLoading(false);
      return;
    }

    if (!/(?=.*[0-9])/.test(passwordData.newPassword)) {
      setPasswordError('Password must contain at least one number.');
      setPasswordLoading(false);
      return;
    }

    try {
      await changePassword(passwordData.currentPassword, passwordData.newPassword);
      setPasswordSuccess('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err: any) {
      console.error('Failed to change password:', err);
      setPasswordError(err.message || 'Failed to change password. Please try again.');
    } finally {
      setPasswordLoading(false);
    }
  };

  /**
   * Handle account deletion
   */
  const handleDeleteAccount = async () => {
    setDeleteLoading(true);
    try {
      // TODO: Implement account deletion API
      // await authAPI.deleteAccount();
      await signOut();
      navigate('/admin/login');
    } catch (err: any) {
      console.error('Failed to delete account:', err);
      setProfileError('Failed to delete account. Please try again.');
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading profile...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>PERSONAL INFO</h1>
      </div>

      <div className={styles.formLayout}>
        {/* Left Column - Personal Info */}
        <div className={styles.leftColumn}>
          <form onSubmit={handleProfileSubmit} className={styles.form}>
            {profileError && (
              <div className={styles.error}>{profileError}</div>
            )}
            {profileSuccess && (
              <div className={styles.success}>{profileSuccess}</div>
            )}

            {/* Personal Information */}
            <div className={styles.section}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Full name</label>
                <input
                  type="text"
                  name="fullName"
                  value={profileData.fullName}
                  onChange={handleProfileChange}
                  className={styles.input}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>E-mail address</label>
                <input
                  type="email"
                  name="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  className={styles.input}
                  required
                  disabled // Email usually can't be changed
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Address</label>
                <input
                  type="text"
                  name="address"
                  value={profileData.address}
                  onChange={handleProfileChange}
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Phone number</label>
                <input
                  type="tel"
                  name="phone"
                  value={profileData.phone}
                  onChange={handleProfileChange}
                  className={styles.input}
                />
              </div>
            </div>

            {/* Password Section */}
            <div className={styles.section}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Create password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className={styles.input}
                  placeholder="Enter new password"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Repeat password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className={styles.input}
                  placeholder="Confirm new password"
                />
              </div>

              <div className={styles.passwordNote}>
                The password must contain at least 8 characters,<br />
                one number and special symbols.
              </div>
            </div>

            {/* Action Buttons */}
            <div className={styles.actionButtons}>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className={styles.deleteButton}
                disabled={deleteLoading}
              >
                Delete account
              </button>
              <button
                type="submit"
                className={styles.saveButton}
                disabled={profileLoading}
              >
                {profileLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column - Profile Image & Organization */}
        <div className={styles.rightColumn}>
          {/* Profile Image */}
          <div className={styles.profileImageSection}>
            <div className={styles.imageContainer}>
              <label className={styles.imageLabel}>
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className={styles.profileImage} />
                ) : (
                  <div className={styles.imagePlaceholder}>
                    <span>👤</span>
                  </div>
                )}
                <div className={styles.cameraIcon}>📷</div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className={styles.imageInput}
                />
              </label>
            </div>
          </div>

          {/* Organization Information */}
          <div className={styles.organizationSection}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Organisation name</label>
              <input
                type="text"
                name="organizationName"
                value={profileData.organizationName}
                onChange={handleProfileChange}
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Organisation address</label>
              <input
                type="text"
                name="organizationAddress"
                value={profileData.organizationAddress}
                onChange={handleProfileChange}
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Organisation number</label>
              <input
                type="text"
                name="organizationNumber"
                value={profileData.organizationNumber}
                onChange={handleProfileChange}
                className={styles.input}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Separate Password Change Form */}
      {passwordData.currentPassword || passwordData.newPassword || passwordData.confirmPassword ? (
        <div className={styles.passwordSection}>
          <form onSubmit={handlePasswordSubmit} className={styles.passwordForm}>
            {passwordError && (
              <div className={styles.error}>{passwordError}</div>
            )}
            {passwordSuccess && (
              <div className={styles.success}>{passwordSuccess}</div>
            )}

            <div className={styles.formGroup}>
              <label className={styles.label}>Current password</label>
              <input
                type="password"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                className={styles.input}
                required
              />
            </div>

            <button
              type="submit"
              className={styles.changePasswordButton}
              disabled={passwordLoading}
            >
              {passwordLoading ? 'Changing...' : 'Change Password'}
            </button>
          </form>
        </div>
      ) : null}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Confirm Account Deletion</h3>
            <p>Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.</p>
            <div className={styles.modalActions}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className={styles.cancelButton}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className={styles.confirmDeleteButton}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;