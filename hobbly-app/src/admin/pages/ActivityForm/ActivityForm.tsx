/**
 * @fileoverview Activity Form page for creating and editing activities
 * @module admin/pages/ActivityForm
 * @description Form for activity creation and editing with image upload
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../shared/contexts/AuthContext';
import activitiesAPI from '../../../api/activities.api';
import { ActivityType, ActivityFormData, Category, Tag } from '../../../types';
import styles from './ActivityForm.module.css';

/**
 * Activity Form page component
 * @returns JSX element
 */
const ActivityForm: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState<ActivityFormData>({
    title: '',
    description: '',
    shortDescription: '',
    type: ActivityType.ACTIVITY,
    categoryId: '',
    location: '',
    address: '',
    coordinates: undefined,
    price: 0,
    currency: 'EUR',
    contactEmail: '',
    contactPhone: '',
    externalLink: '',
    tags: [],
    imageUrl: '',
    startDate: '',
    endDate: ''
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [activityTypes, setActivityTypes] = useState<{id: string, name: string, value: string}[]>([]);
  const [coordinatesInput, setCoordinatesInput] = useState<string>('');
  const [coordinatesError, setCoordinatesError] = useState<string | null>(null);

  // Load categories, tags and types on component mount
  useEffect(() => {
    loadCategoriesAndTagsAndTypes();
  }, []);

  // Load activity data if editing
  useEffect(() => {
    if (isEditing && id) {
      loadActivity(id);
    }
  }, [isEditing, id]);

  /**
   * Load categories, tags and types from API
   */
  const loadCategoriesAndTagsAndTypes = async () => {
    try {
      const [categoriesResponse, tagsResponse, typesResponse] = await Promise.all([
        activitiesAPI.getCategories(),
        activitiesAPI.getTags(),
        activitiesAPI.getActivityTypes()
      ]);
      setCategories(categoriesResponse);
      setTags(tagsResponse);
      setActivityTypes(typesResponse);
    } catch (err) {
      console.error('Failed to load categories, tags and types:', err);
      setError('Failed to load form data.');
    }
  };

  /**
   * Load activity for editing
   */
  const loadActivity = async (activityId: string) => {
    try {
      setLoading(true);
      const activity = await activitiesAPI.getActivityById(activityId);

      setFormData({
        title: activity.title,
        description: activity.description,
        shortDescription: activity.shortDescription || '',
        type: activity.type,
        categoryId: activity.categoryId,
        location: activity.location,
        address: activity.address || '',
        coordinates: activity.coordinates,
        price: activity.price || 0,
        currency: activity.currency || 'EUR',
        contactEmail: activity.contactEmail || '',
        contactPhone: activity.contactPhone || '',
        externalLink: activity.externalLink || '',
        tags: activity.tags?.map(tag => tag.id) || [],
        imageUrl: activity.imageUrl || '',
        startDate: activity.startDate ? new Date(activity.startDate).toISOString().split('T')[0] : '',
        endDate: activity.endDate ? new Date(activity.endDate).toISOString().split('T')[0] : ''
      });

      setSelectedTags(activity.tags?.map(tag => tag.id) || []);
      setImagePreview(activity.imageUrl || '');
      setCoordinatesInput(
        activity.coordinates ? `${activity.coordinates.lat}, ${activity.coordinates.lng}` : ''
      );
      setCoordinatesError(null);
    } catch (err) {
      console.error('Failed to load activity:', err);
      setError('Failed to load activity data.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle form input changes
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  /**
   * Handle coordinates combined input changes (format: "lat, lng")
   */
  const handleCoordinatesCombinedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Always reflect raw text in input
    setCoordinatesInput(raw);
    // Allow empty to clear
    if (!raw || raw.trim() === '') {
      setFormData(prev => ({ ...prev, coordinates: undefined }));
      setCoordinatesError(null);
      return;
    }

    // Parse format: lat, lng (comma or semicolon or space separated)
    const match = raw.replace(/;/g, ',').replace(/\s+/g, '').split(',');
    if (match.length === 2) {
      const lat = parseFloat(match[0]);
      const lng = parseFloat(match[1]);
      const latValid = !Number.isNaN(lat) && lat >= -90 && lat <= 90;
      const lngValid = !Number.isNaN(lng) && lng >= -180 && lng <= 180;
      if (latValid && lngValid) {
        setFormData(prev => ({ ...prev, coordinates: { lat, lng } }));
        setCoordinatesError(null);
      } else {
        // Do not update coordinates if invalid; keep previous value
        setFormData(prev => ({ ...prev }));
        setCoordinatesError('Invalid coordinates. Latitude [-90..90], Longitude [-180..180].');
      }
    } else {
      setCoordinatesError('Use format: "lat, lng" (comma separated).');
    }
  };

  /**
   * Handle image file selection
   */
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  /**
   * Handle tag selection
   */
  const handleTagToggle = (tagName: string) => {
    setSelectedTags(prev => {
      const newTags = prev.includes(tagName)
        ? prev.filter(tag => tag !== tagName)
        : [...prev, tagName];

      setFormData(prevData => ({
        ...prevData,
        tags: newTags
      }));

      return newTags;
    });
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset errors
    setError(null);
    setCoordinatesError(null);
    setLoading(true);

    try {
      // Validate coordinates input before submit
      if (coordinatesInput && coordinatesInput.trim() !== '') {
        if (!formData.coordinates) {
          setCoordinatesError('Invalid coordinates format. Use: "lat, lng".');
          setError('Please correct coordinates before saving.');
          setLoading(false);
          return;
        }
        const { lat, lng } = formData.coordinates;
        const latValid = typeof lat === 'number' && lat >= -90 && lat <= 90;
        const lngValid = typeof lng === 'number' && lng >= -180 && lng <= 180;
        if (!latValid || !lngValid) {
          setCoordinatesError('Invalid coordinates. Latitude [-90..90], Longitude [-180..180].');
          setError('Please correct coordinates before saving.');
          setLoading(false);
          return;
        }
      }

      // Prepare activity data with proper date handling
      const activityData: ActivityFormData = {
        ...formData,
        tags: selectedTags,
        price: formData.price || undefined,
        image: imageFile || undefined,
        // Convert empty date strings to undefined to avoid PostgreSQL timestamp errors
        startDate: formData.startDate && formData.startDate.trim() !== '' ? formData.startDate : undefined,
        endDate: formData.endDate && formData.endDate.trim() !== '' ? formData.endDate : undefined,
        // Отправляем координаты только если оба значения заполнены и валидны
        coordinates: formData.coordinates?.lat && formData.coordinates?.lng ? formData.coordinates : undefined
      };

      console.log('📤 Submitting activity data:', activityData);

      // Create or update activity
      let result;
      if (isEditing && id) {
        result = await activitiesAPI.updateActivity(id, activityData, user?.id, user?.role);
        console.log('✅ Activity updated successfully', result);
        if (!result || !result.id) {
          throw new Error('Update failed: No activity returned from server');
        }
      } else {
        if (!user?.id) {
          throw new Error('User authentication required to create activity');
        }
        result = await activitiesAPI.createActivity(activityData, user.id);
        console.log('✅ Activity created successfully', result);
        if (!result || !result.id) {
          throw new Error('Create failed: No activity returned from server');
        }
      }

      // SUCCESS: Navigate only after successful save
      console.log('🚀 Save successful, navigating...');
      setLoading(false);
      
      // Small delay to ensure state updates are processed
      setTimeout(() => {
        if (isEditing && id) {
          navigate('/admin/activities');
        } else {
          navigate('/admin/activities', {
            state: {
              successMessage: 'Your activity has been submitted and is pending administrator approval.'
            }
          });
        }
      }, 100);
      
    } catch (err: any) {
      // ERROR: Show error and stay on form
      console.error('❌ Failed to save activity:', err);
      console.error('Error details:', {
        message: err?.message,
        response: err?.response?.data,
        status: err?.response?.status
      });
      
      // Создаём понятное сообщение для пользователя
      let userMessage = 'Failed to save activity. ';
      
      if (err?.message?.includes('authentication') || err?.message?.includes('Authentication')) {
        userMessage += 'Please sign in again and try again.';
      } else if (err?.message?.includes('Network') || err?.code === 'NETWORK_ERROR') {
        userMessage += 'Network error. Please check your internet connection.';
      } else if (err?.response?.status === 400) {
        userMessage += 'Invalid data. Please check all required fields.';
      } else if (err?.response?.status === 403) {
        userMessage += 'Access denied. You do not have permission to perform this action.';
      } else if (err?.response?.status === 422) {
        userMessage += 'Validation error. Please check the form data.';
      } else if (err?.response?.status >= 500) {
        userMessage += 'Server error. Please try again later.';
      } else if (err?.message) {
        userMessage += err.message;
      } else {
        userMessage += 'Unknown error occurred. Please try again.';
      }
      
      setError(userMessage);
      setLoading(false);
      
      console.log('⚠️ Save failed, staying on form. Error displayed to user.');
      
      // CRITICAL: Do NOT navigate on error - return early
      return;
    }
  };

  if (loading && isEditing) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading activity...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {error && (
        <div className={styles.error} role="alert">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#721c24',
                fontSize: '20px',
                cursor: 'pointer',
                padding: '0 0 0 12px',
                fontWeight: 'bold'
              }}
              aria-label="Close error message"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formLayout}>
          {/* Left Column */}
          <div className={styles.leftColumn}>
            {/* Name */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Name</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={styles.input}
                required
              />
            </div>

            {/* Date */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Date</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleInputChange}
                className={styles.input}
                required
              />
            </div>

            {/* Type */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className={styles.select}
                required
              >
                <option value="">Select type</option>
                {activityTypes.map((type) => (
                  <option key={type.id} value={type.value}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Category</label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleInputChange}
                className={styles.select}
                required
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className={styles.input}
                required
              />
            </div>

            {/* Address */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className={styles.input}
                placeholder="Full address (optional)"
              />
            </div>

            {/* Coordinates (lat, lng) */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Coordinates (lat, lng)</label>
              <input
                type="text"
                name="coordinates"
                value={coordinatesInput}
                onChange={handleCoordinatesCombinedChange}
                className={styles.input}
                placeholder="60.1699, 24.9384"
                inputMode="decimal"
                aria-describedby="coordsHelp"
                aria-invalid={coordinatesError ? true : false}
              />
              <small id="coordsHelp" className={styles.label}>
                Enter as latitude, longitude. Range: [-90..90], [-180..180]
              </small>
              {coordinatesError && (
                <span className={styles.fieldError} role="alert">
                  {coordinatesError}
                </span>
              )}
            </div>

            {/* Second Row */}
            <div className={styles.formRow}>
              {/* Organiser */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Organiser</label>
                <input
                  type="text"
                  value={user?.organizationName || user?.fullName || ''}
                  className={styles.input}
                  disabled
                />
              </div>

              {/* Price */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Price</label>
                <div className={styles.priceInput}>
                  <input
                    type="number"
                    name="price"
                    value={formData.price || ''}
                    onChange={handleInputChange}
                    className={styles.input}
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                  <span className={styles.currency}>€/h</span>
                </div>
              </div>
            </div>

            {/* Third Row */}
            <div className={styles.formRow}>
              {/* Contact Person */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Contact person</label>
                <input
                  type="text"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleInputChange}
                  className={styles.input}
                  placeholder="Phone number"
                />
              </div>

              {/* Tags */}
              <div className={styles.formGroup}>
                <label className={styles.label}>Tags</label>
                <div className={styles.tagsContainer}>
                  {tags.map(tag => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => handleTagToggle(tag.id)}
                      className={`${styles.tagButton} ${
                        selectedTags.includes(tag.id) ? styles.tagSelected : ''
                      }`}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className={styles.rightColumn}>
            {/* Image Upload */}
            <div className={styles.imageUpload}>
              <label className={styles.imageLabel}>
                {imagePreview ? (
                  <img src={imagePreview} alt="Activity" className={styles.imagePreview} />
                ) : (
                  <div className={styles.imagePlaceholder}>
                    <span>Add photo</span>
                    <span className={styles.imageDimensions}>200ыx400px</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className={styles.imageInput}
                />
              </label>
            </div>

            {/* Description */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Description:</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className={styles.textarea}
                placeholder="Enter activity description..."
                rows={6}
                maxLength={100}
                required
              />
              <div className={styles.charCount}>
                {formData.description.length}/100 characters
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className={styles.formActions}>
          <button
            type="submit"
            disabled={loading}
            className={styles.saveButton}
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ActivityForm;