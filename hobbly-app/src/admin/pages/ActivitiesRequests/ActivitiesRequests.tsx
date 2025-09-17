/**
 * @fileoverview Activities Requests page for admin panel
 * @module admin/pages/ActivitiesRequests
 * @description Management page for pending activity requests from organizers
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { UserRole } from '../../../types';
import styles from './ActivitiesRequests.module.css';

interface ActivityRequest {
  id: string;
  name: string;
  organisation: string;
  location: string;
  price: string;
  userAvatar?: string;
  userName: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
}

/**
 * Activities Requests page component
 * @returns JSX element
 */
const ActivitiesRequests: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ActivityRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const requestsPerPage = 10;

  // Mock data - in real app this would come from API
  useEffect(() => {
    const loadRequests = async () => {
      try {
        setLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));

        const mockRequests: ActivityRequest[] = [
          {
            id: '1',
            name: 'Rick J',
            organisation: 'Nokia',
            location: 'Hämeentie 2',
            price: 'Rick@gmail.com',
            userName: 'Rick Johnson',
            status: 'pending',
            submittedAt: new Date()
          },
          {
            id: '2',
            name: 'Martin G',
            organisation: 'Anora',
            location: 'Viikintie 7',
            price: 'ddgdgdfgdgdd',
            userName: 'Martin Garcia',
            status: 'pending',
            submittedAt: new Date()
          },
          {
            id: '3',
            name: 'Joni M',
            organisation: 'HSL',
            location: 'Mannerheiminaukio',
            price: 'dgdgdgdfgdfgd',
            userName: 'Joni Mattila',
            status: 'pending',
            submittedAt: new Date()
          }
        ];

        setRequests(mockRequests);
      } catch (err) {
        console.error('Failed to load activity requests:', err);
        setError('Failed to load activity requests.');
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, []);

  /**
   * Handle view request details
   */
  const handleViewRequest = (id: string) => {
    console.log('View request:', id);
    // TODO: Implement view request details modal/page
  };

  /**
   * Handle approve request
   */
  const handleApproveRequest = async (id: string) => {
    try {
      // TODO: Implement approve request API call
      console.log('Approve request:', id);
      setRequests(prev => prev.filter(req => req.id !== id));
    } catch (err) {
      console.error('Failed to approve request:', err);
    }
  };

  /**
   * Handle reject/delete request
   */
  const handleRejectRequest = async (id: string) => {
    try {
      // TODO: Implement reject request API call
      console.log('Reject request:', id);
      setRequests(prev => prev.filter(req => req.id !== id));
    } catch (err) {
      console.error('Failed to reject request:', err);
    }
  };

  /**
   * Calculate pagination
   */
  const totalPages = Math.ceil(requests.length / requestsPerPage);
  const startIndex = (currentPage - 1) * requestsPerPage;
  const endIndex = startIndex + requestsPerPage;
  const currentRequests = requests.slice(startIndex, endIndex);

  /**
   * Generate pagination buttons
   */
  const getPaginationButtons = () => {
    const buttons = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(i);
    }

    return buttons;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading activity requests...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>ACTIVITIES' REQUESTS</h1>
      </div>

      {/* Requests Table */}
      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <div className={styles.headerCell}>Name</div>
          <div className={styles.headerCell}>Organisation</div>
          <div className={styles.headerCell}>Location</div>
          <div className={styles.headerCell}>Price</div>
          <div className={styles.headerCell}>Actions</div>
        </div>

        <div className={styles.tableBody}>
          {currentRequests.length === 0 ? (
            <div className={styles.emptyState}>
              No activity requests found.
            </div>
          ) : (
            currentRequests.map((request) => (
              <div key={request.id} className={styles.tableRow}>
                <div className={styles.nameCell}>
                  <div className={styles.userAvatar}>
                    {request.userAvatar ? (
                      <img src={request.userAvatar} alt={request.userName} />
                    ) : (
                      <div className={styles.avatarPlaceholder}>
                        {request.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <span className={styles.userName}>{request.name}</span>
                </div>
                <div className={styles.cell}>{request.organisation}</div>
                <div className={styles.cell}>{request.location}</div>
                <div className={styles.cell}>{request.price}</div>
                <div className={styles.actionsCell}>
                  <button
                    onClick={() => handleViewRequest(request.id)}
                    className={styles.actionButton}
                    title="View details"
                  >
                    👁️
                  </button>
                  <button
                    onClick={() => handleApproveRequest(request.id)}
                    className={`${styles.actionButton} ${styles.approveButton}`}
                    title="Approve request"
                  >
                    ✅
                  </button>
                  <button
                    onClick={() => handleRejectRequest(request.id)}
                    className={`${styles.actionButton} ${styles.rejectButton}`}
                    title="Reject request"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className={styles.paginationButton}
          >
            Previous
          </button>

          {getPaginationButtons().map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => setCurrentPage(pageNum)}
              className={`${styles.paginationButton} ${
                currentPage === pageNum ? styles.paginationButtonActive : ''
              }`}
            >
              {pageNum}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className={styles.paginationButton}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ActivitiesRequests;