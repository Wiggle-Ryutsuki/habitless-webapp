import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header.js';
import { ManagerAnalyticsData } from '../types/challenge.types.js';
import { fetchManagerAnalytics, ManagerApiError } from '../services/manager.service.js';

export const ManagerDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<ManagerAnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isOtherExpanded, setIsOtherExpanded] = useState<boolean>(false);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchManagerAnalytics();
      setData(res);
    } catch (err: any) {
      setError(err instanceof ManagerApiError ? err.message : 'Failed to load analytics.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="manager-dashboard" style={{ minHeight: '100vh', backgroundColor: 'var(--color-background)' }}>
      <Header />

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Page Title */}
        <div style={{ marginBottom: '2rem' }}>
          <h1
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: 'var(--walnut)',
              margin: '0 0 0.5rem 0',
            }}
          >
            Manager Dashboard
          </h1>
          <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>
            Comprehensive analytics on challenge adoption, active learner engagement, and category performance.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--color-text-muted)' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⏳</div>
            Loading analytics data...
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
              onClick={loadAnalytics}
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
        ) : data ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* KPI Summary Strip */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1.25rem',
              }}
            >
              <div
                data-testid="kpi-published-challenges"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  border: '1px solid var(--papaya-whip)',
                  boxShadow: '0 2px 8px rgba(114, 67, 25, 0.04)',
                }}
              >
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Published Challenges
                </div>
                <div style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--walnut)', marginTop: '0.5rem' }}>
                  {data.summary.totalPublishedChallenges}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                  Live on the platform
                </div>
              </div>

              <div
                data-testid="kpi-active-enrollments"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  border: '1px solid var(--papaya-whip)',
                  boxShadow: '0 2px 8px rgba(114, 67, 25, 0.04)',
                }}
              >
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Active Enrollments
                </div>
                <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#2563eb', marginTop: '0.5rem' }}>
                  {data.summary.totalActiveEnrollments}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                  Learners actively participating
                </div>
              </div>

              <div
                data-testid="kpi-completed-enrollments"
                style={{
                  backgroundColor: 'var(--color-surface)',
                  padding: '1.5rem',
                  borderRadius: '12px',
                  border: '1px solid var(--papaya-whip)',
                  boxShadow: '0 2px 8px rgba(114, 67, 25, 0.04)',
                }}
              >
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Completed Enrollments
                </div>
                <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#16a34a', marginTop: '0.5rem' }}>
                  {data.summary.totalCompletedEnrollments}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                  Successfully finished challenges
                </div>
              </div>
            </div>

            {/* 2-Column Layout: Popular Challenges (Left) & Category Breakdown (Right) */}
            <div
              className="manager-dashboard-columns"
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
                gap: '1.5rem',
                alignItems: 'start',
              }}
            >
              {/* Most Popular Challenges Section */}
              <div
                data-testid="popular-challenges-section"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderRadius: '12px',
                border: '1px solid var(--papaya-whip)',
                padding: '1.5rem',
                boxShadow: '0 2px 8px rgba(114, 67, 25, 0.04)',
              }}
            >
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--walnut)', margin: '0 0 1rem 0' }}>
                Most Popular Challenges
              </h2>

              {data.mostPopularChallenges.length === 0 ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  No published challenges with enrollments recorded yet.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr
                        style={{
                          backgroundColor: 'var(--papaya-whip)',
                          color: 'var(--walnut)',
                          fontSize: '0.75rem',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        <th style={{ padding: '10px 14px', borderRadius: '6px 0 0 6px' }}>Rank</th>
                        <th style={{ padding: '10px 14px' }}>Challenge</th>
                        <th style={{ padding: '10px 14px' }}>Category</th>
                        <th style={{ padding: '10px 14px' }}>Manager</th>
                        <th style={{ padding: '10px 14px' }}>Enrollments</th>
                        <th style={{ padding: '10px 14px' }}>Rating</th>
                        <th style={{ padding: '10px 14px', textAlign: 'right', borderRadius: '0 6px 6px 0' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.mostPopularChallenges.map((item, idx) => (
                        <tr
                          key={item.id}
                          style={{
                            borderBottom: '1px solid var(--papaya-whip)',
                            transition: 'background-color 0.15s ease',
                          }}
                        >
                          <td style={{ padding: '14px', fontWeight: 700, color: 'var(--walnut)' }}>
                            #{idx + 1}
                          </td>
                          <td style={{ padding: '14px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--walnut)' }}>{item.title}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                              {item.durationDays} Days Duration
                            </div>
                          </td>
                          <td style={{ padding: '14px' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                backgroundColor: 'var(--papaya-whip)',
                                color: 'var(--walnut)',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                padding: '3px 8px',
                                borderRadius: '12px',
                              }}
                            >
                              {item.category}
                            </span>
                          </td>
                          <td style={{ padding: '14px', fontSize: '0.875rem', color: 'var(--color-text-main)' }}>
                            {item.managerName}
                          </td>
                          <td style={{ padding: '14px', fontWeight: 700, color: 'var(--walnut)' }}>
                            {item.enrollmentCount}
                          </td>
                          <td style={{ padding: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ color: '#f59e0b', fontSize: '1rem' }}>★</span>
                              <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                                {item.averageRating > 0 ? item.averageRating.toFixed(1) : '—'}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '14px', textAlign: 'right' }}>
                            <button
                              type="button"
                              onClick={() => navigate(`/manager/challenges/${item.id}`)}
                              style={{
                                backgroundColor: 'transparent',
                                border: '1px solid var(--walnut)',
                                color: 'var(--walnut)',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                fontWeight: 600,
                                fontSize: '0.8125rem',
                                cursor: 'pointer',
                              }}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Top Categories Breakdown Section */}
            <div
              data-testid="top-categories-section"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderRadius: '12px',
                border: '1px solid var(--papaya-whip)',
                padding: '1.5rem',
                boxShadow: '0 2px 8px rgba(114, 67, 25, 0.04)',
              }}
            >
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--walnut)', margin: '0 0 1rem 0' }}>
                Category Breakdown & Completion Rates
              </h2>

              {data.topCategories.length === 0 ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  No category data available yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {data.topCategories.map((cat) => {
                    const isOther = !cat.isPreset;
                    return (
                      <div
                        key={cat.category}
                        style={{
                          backgroundColor: '#fafafa',
                          borderRadius: '8px',
                          border: '1px solid var(--papaya-whip)',
                          padding: '1rem',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexWrap: 'wrap',
                            gap: '0.5rem',
                            marginBottom: '0.5rem',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 700, color: 'var(--walnut)', fontSize: '1rem' }}>
                              {cat.category}
                            </span>
                            <span
                              style={{
                                fontSize: '0.6875rem',
                                fontWeight: 600,
                                padding: '2px 8px',
                                borderRadius: '10px',
                                backgroundColor: cat.isPreset ? 'var(--papaya-whip)' : '#e0e7ff',
                                color: cat.isPreset ? 'var(--walnut)' : '#3730a3',
                              }}
                            >
                              {cat.isPreset ? 'Preset' : 'Custom Aggregate'}
                            </span>
                          </div>

                          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                            <strong>{cat.challengesCount}</strong> challenges · <strong>{cat.totalEnrollments}</strong> enrollments · <strong>{cat.completionRate}%</strong> completion
                          </div>
                        </div>

                        {/* Completion Rate Bar */}
                        <div
                          style={{
                            height: '8px',
                            backgroundColor: '#e5e7eb',
                            borderRadius: '4px',
                            overflow: 'hidden',
                            marginBottom: isOther && cat.customCategories && cat.customCategories.length > 0 ? '0.75rem' : '0',
                          }}
                        >
                          <div
                            style={{
                              width: `${Math.min(100, Math.max(0, cat.completionRate))}%`,
                              height: '100%',
                              backgroundColor: 'var(--walnut)',
                              borderRadius: '4px',
                              transition: 'width 0.4s ease',
                            }}
                          />
                        </div>

                        {/* Other Category Accordion Drill-down */}
                        {isOther && cat.customCategories && cat.customCategories.length > 0 && (
                          <div style={{ marginTop: '0.75rem', borderTop: '1px dashed #e2e8f0', paddingTop: '0.5rem' }}>
                            <button
                              type="button"
                              data-testid="other-categories-accordion-toggle"
                              onClick={() => setIsOtherExpanded(!isOtherExpanded)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--walnut)',
                                fontSize: '0.8125rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                padding: '4px 0',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <span>{isOtherExpanded ? '▼ Hide' : '▶ Show'} Custom Categories Drill-down ({cat.customCategories.length})</span>
                            </button>

                            {isOtherExpanded && (
                              <div
                                data-testid="other-categories-drilldown"
                                style={{
                                  marginTop: '0.5rem',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '0.5rem',
                                }}
                              >
                                {cat.customCategories.map((sub) => (
                                  <div
                                    key={sub.category}
                                    style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      padding: '8px 12px',
                                      backgroundColor: '#ffffff',
                                      borderRadius: '6px',
                                      border: '1px solid #e2e8f0',
                                      fontSize: '0.8125rem',
                                    }}
                                  >
                                    <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                                      {sub.category}
                                    </span>
                                    <div style={{ color: 'var(--color-text-muted)' }}>
                                      {sub.challengesCount} challenges · {sub.totalEnrollments} enrollments · {sub.completionRate}% completion
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            </div>
          </div>
        ) : null}
      </main>

      {/* Responsive layout styles */}
      <style>{`
        @media (max-width: 960px) {
          .manager-dashboard-columns {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};
