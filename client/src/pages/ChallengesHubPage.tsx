import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '../components/Header.js';
import { ChallengeItem } from '../types/challenge.types.js';
import { fetchChallenges, ChallengeApiError } from '../services/challenges.service.js';
import { ChallengeInfoModal } from '../components/ChallengeInfoModal.js';
import { HABIT_CATEGORY_PRESETS } from '../components/CategorySelector.js';

type StatusFilterType = 'ALL' | 'AVAILABLE' | 'ENROLLED' | 'ENDED';

export const ChallengesHubPage: React.FC = () => {
  const [challenges, setChallenges] = useState<ChallengeItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>('ALL');

  // Modal
  const [selectedProgramId, setSelectedProgramId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const loadChallenges = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchChallenges({
        q: searchQuery.trim() || undefined,
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
        status: statusFilter,
      });
      setChallenges(data);
    } catch (err: any) {
      setError(err instanceof ChallengeApiError ? err.message : 'Failed to load challenges.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadChallenges();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadChallenges]);

  const handleOpenDetail = (programId: number) => {
    setSelectedProgramId(programId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProgramId(null);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--color-background)' }}>
      <Header />

      <main style={{ maxWidth: '1120px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Title & Introduction */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: 'var(--walnut)',
              margin: '0 0 0.5rem 0',
            }}
          >
            Challenges Hub
          </h1>
          <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>
            Discover expert-curated habit challenges, sync template curriculum to your calendar, and track your progress with the community.
          </p>
        </div>

        {/* Discovery Bar */}
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--papaya-whip)',
            borderRadius: '12px',
            padding: '1.25rem',
            marginBottom: '1.75rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem',
              alignItems: 'center',
            }}
          >
            {/* Search Input */}
            <div style={{ flex: '1 1 240px' }}>
              <input
                type="text"
                placeholder="Search by title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search challenges"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  fontSize: '0.875rem',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Category Dropdown */}
            <div style={{ flex: '0 1 200px' }}>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                aria-label="Filter by category"
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  fontSize: '0.875rem',
                  backgroundColor: '#fff',
                  boxSizing: 'border-box',
                }}
              >
                <option value="ALL">All Categories</option>
                {HABIT_CATEGORY_PRESETS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {(['ALL', 'AVAILABLE', 'ENROLLED', 'ENDED'] as StatusFilterType[]).map((tab) => {
              const active = statusFilter === tab;
              const labels: Record<StatusFilterType, string> = {
                ALL: 'All Challenges',
                AVAILABLE: 'Available',
                ENROLLED: 'Enrolled',
                ENDED: 'Ended',
              };
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatusFilter(tab)}
                  aria-pressed={active}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    border: active ? '1px solid var(--walnut)' : '1px solid #e2e8f0',
                    backgroundColor: active ? 'var(--walnut)' : '#fff',
                    color: active ? '#fff' : 'var(--color-text)',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {labels[tab]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Challenge Cards Grid */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
            Loading challenges...
          </div>
        )}

        {error && (
          <div
            role="alert"
            style={{
              padding: '1rem',
              backgroundColor: '#fff5f5',
              color: '#c53030',
              borderRadius: '8px',
              border: '1px solid #feb2b2',
              marginBottom: '1.5rem',
            }}
          >
            {error}
          </div>
        )}

        {!loading && !error && challenges.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '3.5rem 1rem',
              backgroundColor: 'var(--color-surface)',
              borderRadius: '12px',
              border: '1px solid var(--papaya-whip)',
              color: 'var(--color-text-muted)',
            }}
          >
            <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
              No challenges found matching your criteria.
            </p>
            <p style={{ margin: '6px 0 0 0', fontSize: '0.875rem' }}>
              Try adjusting your search query, category, or status filter.
            </p>
          </div>
        )}

        {!loading && !error && challenges.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {challenges.map((prog) => {
              const isPastDate = new Date(prog.endDate) < new Date();
              const isEnded = isPastDate || prog.status !== 'PUBLISHED';
              const isEnrolled = prog.myEnrollment?.status === 'ACTIVE';

              return (
                <div
                  key={prog.id}
                  data-testid={`challenge-card-${prog.id}`}
                  style={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--papaya-whip)',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  }}
                >
                  <div>
                    {/* Category & Status Pill Header */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.75rem',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '3px 8px',
                          borderRadius: '12px',
                          backgroundColor: '#e8f0fe',
                          color: '#1a73e8',
                        }}
                      >
                        {prog.category}
                      </span>

                      {isEnded ? (
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '10px',
                            backgroundColor: '#ffebee',
                            color: '#c62828',
                            border: '1px solid #ef9a9a',
                          }}
                        >
                          Challenge (Ended)
                        </span>
                      ) : isEnrolled ? (
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '10px',
                            backgroundColor: '#e6fffa',
                            color: '#234e52',
                            border: '1px solid #81e6d9',
                          }}
                        >
                          Enrolled
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '10px',
                            backgroundColor: '#fff8e1',
                            color: '#b78103',
                            border: '1px solid #ffe082',
                          }}
                        >
                          Challenge
                        </span>
                      )}
                    </div>

                    {/* Title & Organizer */}
                    <h2
                      style={{
                        margin: '0 0 0.35rem 0',
                        fontSize: '1.125rem',
                        fontWeight: 700,
                        color: 'var(--walnut)',
                        lineHeight: 1.3,
                      }}
                    >
                      {prog.title}
                    </h2>
                    <p
                      style={{
                        margin: '0 0 0.75rem 0',
                        fontSize: '0.8125rem',
                        color: 'var(--color-text-muted)',
                      }}
                    >
                      By {prog.manager?.fullName || 'Program Manager'}
                    </p>

                    {/* Description */}
                    {prog.description && (
                      <p
                        style={{
                          margin: '0 0 1rem 0',
                          fontSize: '0.875rem',
                          color: 'var(--color-text)',
                          lineHeight: 1.4,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {prog.description}
                      </p>
                    )}
                  </div>

                  <div>
                    {/* Metadata strip */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.75rem',
                        color: '#718096',
                        padding: '0.75rem 0',
                        borderTop: '1px solid #f0f0f0',
                        borderBottom: '1px solid #f0f0f0',
                        marginBottom: '1rem',
                      }}
                    >
                      <span>{prog.activitiesCount ?? 0} activities</span>
                      <span>{prog.enrollmentsCount ?? 0} participants</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <span style={{ color: '#ecc94b', fontSize: '0.875rem' }}>★</span>
                        <strong>{prog.averageRating > 0 ? prog.averageRating.toFixed(1) : '-'}</strong>
                        <span>({prog.ratingsCount})</span>
                      </span>
                    </div>

                    {/* Action Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenDetail(prog.id)}
                      aria-label={`View details for ${prog.title}`}
                      style={{
                        width: '100%',
                        padding: '9px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: isEnrolled
                          ? '#2c7a7b'
                          : isEnded
                          ? '#718096'
                          : 'var(--walnut)',
                        color: '#fff',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      {isEnrolled
                        ? 'Enrolled — View Details'
                        : isEnded
                        ? 'View Ended Challenge'
                        : prog.myEnrollment?.status === 'LEFT'
                        ? 'Re-Join Challenge'
                        : 'Join Challenge'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Challenge Info Modal */}
      <ChallengeInfoModal
        isOpen={isModalOpen}
        programId={selectedProgramId}
        onClose={handleCloseModal}
        onEnrollmentChanged={loadChallenges}
      />
    </div>
  );
};
export default ChallengesHubPage;
