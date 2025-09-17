/**
 * @fileoverview Activity Form page for creating and editing activities
 * @module admin/pages/ActivityForm
 * @description Form for activity creation and editing with image upload
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../shared/contexts/AuthContext';
import activitiesAPI from '../../../api/activities.api';
import { Activity, ActivityType, ActivityFormData, Category, Tag, TAGS } from '../../../types';
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

  // Load categories and tags on component mount
  useEffect(() => {
    loadCategoriesAndTags();
  }, []);

  // Load activity data if editing
  useEffect(() => {
    if (isEditing && id) {
      loadActivity(id);
    }
  }, [isEditing, id]);

  /**
   * Load categories and tags from API
   */
  const loadCategoriesAndTags = async () => {
    try {
      const [categoriesResponse, tagsResponse] = await Promise.all([
        activitiesAPI.getCategories(),
        activitiesAPI.getTags()
      ]);
      setCategories(categoriesResponse);
      setTags(tagsResponse);
    } catch (err) {
      console.error('Failed to load categories and tags:', err);
      setError('Failed to load form data.');
    }
  };

  /**
   * Load activity for editing
   */
  const loadActivity = async (activityId: string) => {
    try {
      setLoading(true);
      const activity = await activitiesAPI.getActivity(activityId);

      setFormData({
        title: activity.title,
        description: activity.description,
        shortDescription: activity.shortDescription || '',
        type: activity.type,
        categoryId: activity.categoryId,
        location: activity.location,
        address: activity.address || '',
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

    try {
      setLoading(true);
      setError(null);

      // Prepare activity data with proper date handling
      const activityData: ActivityFormData = {
        ...formData,
        tags: selectedTags,
        price: formData.price || undefined,
        image: imageFile || undefined,
        // Convert empty date strings to undefined to avoid PostgreSQL timestamp errors
        startDate: formData.startDate && formData.startDate.trim() !== '' ? formData.startDate : undefined,
        endDate: formData.endDate && formData.endDate.trim() !== '' ? formData.endDate : undefined
      };

      console.log('Submitting activity data:', activityData);

      // Create or update activity
      if (isEditing && id) {
        await activitiesAPI.updateActivity(id, activityData, user?.id, user?.role);
      } else {
        if (!user?.id) {
          throw new Error('User authentication required to create activity');
        }
        await activitiesAPI.createActivity(activityData, user.id);
      }

      // Navigate back to activities list
      navigate('/admin/activities');
    } catch (err) {
      console.error('Failed to save activity:', err);
      if (err instanceof Error) {
        console.error('Error details:', err.message);
      }
      setError('Failed to save activity. Please try again.');
    } finally {
      setLoading(false);
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
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>ACTIVITY</h1>
      </div>

      {error && (
        <div className={styles.error}>
          {error}
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
                <option value={ActivityType.ACTIVITY}>Activity</option>
                <option value={ActivityType.EVENT}>Event</option>
                <option value={ActivityType.HOBBY_OPPORTUNITY}>Hobby Opportunity</option>
                <option value={ActivityType.CLUB}>Club</option>
                <option value={ActivityType.COMPETITION}>Competition</option>
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
                    <span className={styles.imageDimensions}>400x400px</span>
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
