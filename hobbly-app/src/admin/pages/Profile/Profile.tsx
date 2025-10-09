/**
 * @fileoverview Personal Info/Profile page for admin panel
 * @module admin/pages/Profile
 * @description User profile management with personal and organization data
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../shared/contexts/AuthContext';
import usersAPI from '../../../api/users.api';
import { User, UserRole } from '../../../types';
import styles from './Profile.module.css';

interface ProfileFormData {
  fullName: string;
  email: string;
  address: string;
  phone: string;
  organizationName: string;
  organizationAddress: string;
  organizationNumber: string;
  role: UserRole;
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
  const [searchParams] = useSearchParams();
  const userId = searchParams.get('userId');

  const [profileData, setProfileData] = useState<ProfileFormData>({
    fullName: '',
    email: '',
    address: '',
    phone: '',
    organizationName: '',
    organizationAddress: '',
    organizationNumber: '',
    role: UserRole.USER
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

  // Состояния для просмотра профиля другого пользователя
  const [viewedUser, setViewedUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);

  // Определяем, просматриваем ли мы профиль другого пользователя
  const isViewingOtherUser = Boolean(userId && userId !== user?.id);
  const isReadOnlyMode = isViewingOtherUser && user?.role !== UserRole.ADMIN;
  const currentUserProfile = isViewingOtherUser ? viewedUser : user;

  // Load user data for viewing another user's profile
  useEffect(() => {
    const loadUserProfile = async () => {
      if (userId && userId !== user?.id) {
        // Загружаем профиль другого пользователя
        setLoadingUser(true);
        setUserError(null);
        try {
          const userData = await usersAPI.getUser(userId);
          setViewedUser(userData);
        } catch (err: any) {
          console.error('Failed to load user profile:', err);
          setUserError('Failed to load user profile. User may not exist or you may not have permission to view this profile.');
        } finally {
          setLoadingUser(false);
        }
      } else {
        // Очищаем состояние при переходе к своему профилю
        setViewedUser(null);
        setUserError(null);
      }
    };

    loadUserProfile();
  }, [userId, user?.id]);

  // Load user data on mount
  useEffect(() => {
    const activeUser = currentUserProfile;
    if (activeUser) {
      setProfileData({
        fullName: activeUser.fullName || '',
        email: activeUser.email,
        address: activeUser.address || '',
        phone: activeUser.phone || '',
        organizationName: activeUser.organizationName || '',
        organizationAddress: activeUser.organizationAddress || '',
        organizationNumber: activeUser.organizationNumber || '',
        role: activeUser.role
      });
      setProfileImage(activeUser.photoUrl || '');
    }
  }, [currentUserProfile]);

  /**
   * Handle profile form input changes
   */
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
    if (!file) return;

    // Clear previous errors
    setProfileError(null);

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setProfileError('Invalid file format. Please upload JPEG, PNG, or WebP images only.');
      e.target.value = ''; // Clear the input
      return;
    }

    // Validate file size (5MB = 5 * 1024 * 1024 bytes)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      setProfileError(`File too large. Maximum size allowed is 5MB, but got ${fileSizeMB}MB. Please choose a smaller image.`);
      e.target.value = ''; // Clear the input
      return;
    }

    // Validate image dimensions (optional - max 2000x2000)
    const img = new Image();
    img.onload = () => {
      const maxDimension = 2000;
      if (img.width > maxDimension || img.height > maxDimension) {
        setProfileError(`Image too large. Maximum dimensions allowed are ${maxDimension}x${maxDimension}px, but got ${img.width}x${img.height}px.`);
        e.target.value = ''; // Clear the input
        return;
      }

      // All validations passed - set the file
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    };

    img.onerror = () => {
      setProfileError('Failed to load image. Please select a valid image file.');
      e.target.value = ''; // Clear the input
    };

    img.src = URL.createObjectURL(file);
  };

  /**
   * Handle profile form submission
   */
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError(null);

    try {
      // Additional client-side validation before submission
      if (imageFile) {
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (imageFile.size > maxSize) {
          const fileSizeMB = (imageFile.size / (1024 * 1024)).toFixed(2);
          throw new Error(`File too large. Maximum size allowed is 5MB, but got ${fileSizeMB}MB.`);
        }
      }

      if (isViewingOtherUser && userId) {
        // Редактирование чужого профиля админом
        await usersAPI.updateUser(userId, {
          ...profileData,
          ...(imageFile ? { photo: imageFile } : {})
        });
        setProfileSuccess('User profile updated successfully!');
        // Опционально можно перенаправить обратно к списку пользователей
        // setTimeout(() => navigate('/admin/users'), 2000);
      } else {
        // Редактирование своего профиля
        await updateProfile({
          ...profileData,
          ...(imageFile ? { photo: imageFile } : {})
        });
        setProfileSuccess('Profile updated successfully!');
      }

      setImageFile(null); // Clear the pending image file
    } catch (err: any) {
      console.error('Failed to update profile:', err);

      // Parse error message for better user experience
      let errorMessage = 'Failed to update profile. Please try again.';

      if (err.message) {
        if (err.message.includes('File too large') || err.message.includes('too large')) {
          errorMessage = err.message;
        } else if (err.message.includes('Invalid file format') || err.message.includes('file format')) {
          errorMessage = 'Invalid file format. Please upload JPEG, PNG, or WebP images only.';
        } else if (err.message.includes('Network Error') || err.message.includes('timeout')) {
          errorMessage = 'Network error. Please check your connection and try again.';
        } else if (err.message.includes('authentication') || err.message.includes('token')) {
          errorMessage = 'Session expired. Please log in again.';
        } else {
          errorMessage = err.message;
        }
      }

      setProfileError(errorMessage);
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

  // Loading states
  if (!user || loadingUser) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          {loadingUser ? 'Loading user profile...' : 'Loading profile...'}
        </div>
      </div>
    );
  }

  // Check permission to view other user's profile
  if (isViewingOtherUser && user?.role !== UserRole.ADMIN) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>Access denied. Only administrators can view other users' profiles.</p>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className={styles.retryButton}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Error state for viewing other user
  if (userError) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>{userError}</p>
          <button
            onClick={() => navigate('/admin/users')}
            className={styles.retryButton}
          >
            Back to Users
          </button>
        </div>
      </div>
    );
  }

  // If trying to view other user but no data loaded yet
  if (isViewingOtherUser && !viewedUser) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading user profile...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Profile Header */}
      {isViewingOtherUser && currentUserProfile && (
        <div className={styles.profileHeader}>
          <h2>Profile of {currentUserProfile.fullName || currentUserProfile.email}</h2>
          <p className={styles.profileSubtitle}>
            Role: {currentUserProfile.role} |
            Status: {currentUserProfile.isApproved ? 'Approved' : 'Pending'}
          </p>
        </div>
      )}

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
                  readOnly={isReadOnlyMode}
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
                  readOnly={isReadOnlyMode}
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
                  readOnly={isReadOnlyMode}
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
                  readOnly={isReadOnlyMode}
                />
              </div>

              {/* Role Selection - Only show for admin editing other users */}
              {(user?.role === UserRole.ADMIN) && (
                <div className={styles.formGroup}>
                  <label className={styles.label}>Role</label>
                  <select
                    name="role"
                    value={profileData.role}
                    onChange={handleProfileChange}
                    className={styles.input}
                    disabled={isReadOnlyMode}
                  >
                    <option value={UserRole.USER}>User</option>
                    <option value={UserRole.ORGANIZER}>Organizer</option>
                    <option value={UserRole.ADMIN}>Admin</option>
                  </select>
                </div>
              )}
            </div>

            {/* Password Section - Only show for own profile */}
            {!isReadOnlyMode && (
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
            )}

            {/* Action Buttons - Only show for own profile */}
            {!isReadOnlyMode && (
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
            )}
          </form>
        </div>

        {/* Right Column - Profile Image & Organization */}
        <div className={styles.rightColumn}>
          {/* Profile Image */}
          <div className={styles.profileImageSection}>
            <div className={styles.imageContainer}>
              {isReadOnlyMode ? (
                // Read-only mode - just show the image without edit functionality
                <div className={styles.imageViewOnly}>
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                      className={styles.profileImage}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        const initials = currentUserProfile?.fullName
                          ? currentUserProfile.fullName.split(' ').map(n => n[0]).join('').toUpperCase()
                          : currentUserProfile?.email[0].toUpperCase() || 'U';
                        target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=200&background=f0f0f0&color=666&format=png`;
                      }}
                    />
                  ) : (
                    <div className={styles.imagePlaceholder}>
                      <span>👤</span>
                    </div>
                  )}
                </div>
              ) : (
                // Edit mode - allow image upload
                <label className={styles.imageLabel}>
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                      className={styles.profileImage}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        const initials = currentUserProfile?.fullName
                          ? currentUserProfile.fullName.split(' ').map(n => n[0]).join('').toUpperCase()
                          : currentUserProfile?.email[0].toUpperCase() || 'U';
                        target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&size=200&background=f0f0f0&color=666&format=png`;
                      }}
                    />
                  ) : (
                    <div className={styles.imagePlaceholder}>
                      <span>👤</span>
                    </div>
                  )}
                  <div className={styles.cameraIcon}>📷</div>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleImageChange}
                    className={styles.imageInput}
                  />
                </label>
              )}
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
                readOnly={isReadOnlyMode}
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
                readOnly={isReadOnlyMode}
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
                readOnly={isReadOnlyMode}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Separate Password Change Form - Only for own profile */}
      {!isReadOnlyMode && (passwordData.currentPassword || passwordData.newPassword || passwordData.confirmPassword) ? (
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

      {/* Delete Confirmation Modal - Only for own profile */}
      {!isReadOnlyMode && showDeleteConfirm && (
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
