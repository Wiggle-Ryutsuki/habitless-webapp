import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header.js';
import { ManagerDirectoryItem } from '../types/challenge.types.js';
import { fetchManagerDirectory, ManagerApiError } from '../services/manager.service.js';
import { HABIT_CATEGORY_PRESETS } from '../components/CategorySelector.js';

export const ManagerDirectoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [challenges, setChallenges] = useState<ManagerDirectoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const loadDirectory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchManagerDirectory({
        q: searchQuery.trim() || undefined,
        category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
      });
      setChallenges(res);
    } catch (err: any) {
      setError(err instanceof ManagerApiError ? err.message : 'Failed to load directory challenges.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadDirectory();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadDirectory]);

  return (
    <div data-testid="manager-directory-page" style={{ minHeight: '100vh', backgroundColor: 'var(--color-background)' }}>
      <Header />

      <main style={{ maxWidth: '1120px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Page Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: 'var(--walnut)',
              margin: '0 0 0.5rem 0',
            }}
          >
            Manager Challenges Directory
          </h1>
          <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>
            Explore published challenges created by all program managers across the platform.
          </p>
        </div>

        {/* Discovery & Search Bar */}
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            padding: '1rem',
            borderRadius: '12px',
            border: '1px solid var(--papaya-whip)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1rem',
            alignItems: 'center',
            marginBottom: '2rem',
            boxShadow: '0 2px 8px rgba(114, 67, 25, 0.04)',
          }}
        >
          {/* Search Input */}
          <div style={{ flex: '1 1 260px' }}>
            <input
              type="text"
              data-testid="directory-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search challenges by title or description..."
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #d4be93',
                fontSize: '0.9375rem',
                backgroundColor: '#fff',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Category Filter */}
          <div style={{ flex: '0 1 200px' }}>
            <select
              data-testid="directory-category-filter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #d4be93',
                fontSize: '0.9375rem',
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
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Challenge Cards Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--color-text-muted)' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⏳</div>
            Loading challenges...
          </div>
        ) : error ? (
          <div
            style={{
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              padding: '1.25rem',
              borderRadius: '8px',
              border: '1px solid #fecaca',
              marginBottom: '2rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span>{error}</span>
            <button
              onClick={loadDirectory}
              style={{
                backgroundColor: 'var(--walnut)',
                color: '#fff',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
          </div>
        ) : challenges.length === 0 ? (
          <div
            style={{
              backgroundColor: 'var(--color-surface)',
              borderRadius: '12px',
              border: '1px solid var(--papaya-whip)',
              padding: '3rem 1.5rem',
              textAlign: 'center',
              color: 'var(--color-text-muted)',
            }}
          >
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔍</div>
            <div style={{ fontWeight: 700, color: 'var(--walnut)', fontSize: '1.125rem', marginBottom: '0.25rem' }}>
              No Challenges Found
            </div>
            <div>Try adjusting your search query or category filter.</div>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {challenges.map((c) => (
              <div
                key={c.id}
                data-testid={`directory-challenge-card-${c.id}`}
                style={{
                  backgroundColor: 'var(--color-surface)',
                  borderRadius: '14px',
                  border: '1px solid var(--papaya-whip)',
                  boxShadow: '0 4px 14px rgba(114, 67, 25, 0.05)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
              >
                {/* Card Top Banner */}
                <div
                  style={{
                    backgroundColor: 'var(--walnut)',
                    color: '#fff',
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span
                    style={{
                      backgroundColor: 'var(--golden-sand)',
                      color: 'var(--walnut)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '10px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    {c.category}
                  </span>

                  {c.isOwnedByMe && (
                    <span
                      data-testid="your-program-badge"
                      style={{
                        backgroundColor: '#dcfce7',
                        color: '#15803d',
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        border: '1px solid #bbf7d0',
                      }}
                    >
                      Your Program
                    </span>
                  )}
                </div>

                {/* Card Body */}
                <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3
                    style={{
                      fontSize: '1.125rem',
                      fontWeight: 700,
                      color: 'var(--walnut)',
                      margin: '0 0 0.5rem 0',
                    }}
                  >
                    {c.title}
                  </h3>

                  <p
                    style={{
                      fontSize: '0.875rem',
                      color: 'var(--color-text-muted)',
                      margin: '0 0 1rem 0',
                      lineHeight: 1.4,
                      flex: 1,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {c.description || 'No description provided.'}
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      paddingTop: '0.75rem',
                      borderTop: '1px solid var(--papaya-whip)',
                      fontSize: '0.8125rem',
                      color: 'var(--color-text-main)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>Manager:</span>
                      <strong style={{ color: 'var(--walnut)' }}>{c.manager.fullName}</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>Duration:</span>
                      <strong>{c.durationDays} Days</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>Curriculum:</span>
                      <strong>{c.activitiesCount} Activities</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>Enrollments:</span>
                      <strong>{c.enrollmentsCount}</strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--color-text-muted)' }}>Rating:</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ color: '#f59e0b' }}>★</span>
                        <strong>{c.averageRating > 0 ? c.averageRating.toFixed(1) : '—'}</strong>
                        <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                          ({c.ratingsCount})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div
                  style={{
                    padding: '0.75rem 1.25rem 1.25rem',
                    borderTop: '1px solid var(--papaya-whip)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => navigate(`/manager/challenges/${c.id}`)}
                    style={{
                      width: '100%',
                      backgroundColor: 'var(--walnut)',
                      color: '#fff',
                      border: 'none',
                      padding: '10px 16px',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                    }}
                  >
                    View Challenge Details →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
