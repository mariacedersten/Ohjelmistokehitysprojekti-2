/**
 * @fileoverview Users Requests page for admin panel
 * @module admin/pages/UsersRequests
 * @description Management page for pending user registration requests
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { UserRole } from '../../../types';
import styles from './UsersRequests.module.css';

interface UserRequest {
  id: string;
  name: string;
  organisation: string;
  phoneNumber: string;
  email: string;
  userAvatar?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: Date;
}

/**
 * Users Requests page component
 * @returns JSX element
 */
const UsersRequests: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<UserRequest[]>([]);
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

        const mockRequests: UserRequest[] = [
          {
            id: '1',
            name: 'Rick J',
            organisation: 'Nokia',
            phoneNumber: 'Hämeentie 2',
            email: 'Rick@gmail.com',
            status: 'pending',
            submittedAt: new Date()
          },
          {
            id: '2',
            name: 'Martin G',
            organisation: 'Anora',
            phoneNumber: 'Viikintie 7',
            email: 'ddgdgdfgdgdd',
            status: 'pending',
            submittedAt: new Date()
          },
          {
            id: '3',
            name: 'Joni M',
            organisation: 'HSL',
            phoneNumber: 'Mannerheiminaukio',
            email: 'dgdgdgdfgdfgd',
            status: 'pending',
            submittedAt: new Date()
          }
        ];

        setRequests(mockRequests);
      } catch (err) {
        console.error('Failed to load user requests:', err);
        setError('Failed to load user requests.');
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
        <div className={styles.loading}>Loading user requests...</div>
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
        <h1 className={styles.title}>USERS' REQUESTS</h1>
      </div>

      {/* Requests Table */}
      <div className={styles.tableContainer}>
        <div className={styles.tableHeader}>
          <div className={styles.headerCell}>Name</div>
          <div className={styles.headerCell}>Organisation</div>
          <div className={styles.headerCell}>Phone number</div>
          <div className={styles.headerCell}>E-mail</div>
          <div className={styles.headerCell}>Actions</div>
        </div>

        <div className={styles.tableBody}>
          {currentRequests.length === 0 ? (
            <div className={styles.emptyState}>
              No user requests found.
            </div>
          ) : (
            currentRequests.map((request) => (
              <div key={request.id} className={styles.tableRow}>
                <div className={styles.nameCell}>
                  <div className={styles.userAvatar}>
                    {request.userAvatar ? (
                      <img src={request.userAvatar} alt={request.name} />
                    ) : (
                      <div className={styles.avatarPlaceholder}>
                        {request.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <span className={styles.userName}>{request.name}</span>
                </div>
                <div className={styles.cell}>{request.organisation}</div>
                <div className={styles.cell}>{request.phoneNumber}</div>
                <div className={styles.cell}>{request.email}</div>
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

export default UsersRequests;