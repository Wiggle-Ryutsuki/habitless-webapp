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

      <main style={{ maxWidth: '100%', margin: '0 auto', padding: '2rem 2rem', boxSizing: 'border-box' }}>
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

            {/* 2-Column Layout: Popular Challenges (Wide Left) & Category Breakdown (Sidebar Right) */}
            <div
              className="manager-dashboard-columns"
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) 340px',
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
                        <th style={{ padding: '10px 10px 10px 14px', borderRadius: '6px 0 0 6px', width: '45px' }}>Rank</th>
                        <th style={{ padding: '10px 12px' }}>Challenge</th>
                        <th style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>Category</th>
                        <th style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>Manager</th>
                        <th style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>Enrollments</th>
                        <th style={{ padding: '10px 12px', whiteSpace: 'nowrap' }}>Rating</th>
                        <th style={{ padding: '10px 14px 10px 10px', textAlign: 'right', borderRadius: '0 6px 6px 0', width: '70px' }}>Action</th>
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
                          <td style={{ padding: '12px 10px 12px 14px', fontWeight: 700, color: 'var(--walnut)' }}>
                            #{idx + 1}
                          </td>
                          <td style={{ padding: '12px 12px' }}>
                            <div style={{ fontWeight: 600, color: 'var(--walnut)', fontSize: '0.9375rem' }}>{item.title}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                              {item.durationDays} Days Duration
                            </div>
                          </td>
                          <td style={{ padding: '12px 12px', whiteSpace: 'nowrap' }}>
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
                          <td style={{ padding: '12px 12px', fontSize: '0.875rem', color: 'var(--color-text-main)', whiteSpace: 'nowrap' }}>
                            {item.managerName}
                          </td>
                          <td style={{ padding: '12px 12px', fontWeight: 700, color: 'var(--walnut)', whiteSpace: 'nowrap' }}>
                            {item.enrollmentCount}
                          </td>
                          <td style={{ padding: '12px 12px', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ color: '#f59e0b', fontSize: '1rem' }}>★</span>
                              <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>
                                {item.averageRating > 0 ? item.averageRating.toFixed(1) : '—'}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px 12px 10px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <button
                              type="button"
                              onClick={() => navigate(`/manager/challenges/${item.id}`)}
                              style={{
                                backgroundColor: 'transparent',
                                border: '1px solid var(--walnut)',
                                color: 'var(--walnut)',
                                padding: '5px 12px',
                                borderRadius: '6px',
                                fontWeight: 600,
                                fontSize: '0.8125rem',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
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
                          <div style={{ marginTop: '0.875rem', borderTop: '1px solid #ebdcc5', paddingTop: '0.75rem' }}>
                            <button
                              type="button"
                              data-testid="other-categories-accordion-toggle"
                              onClick={() => setIsOtherExpanded(!isOtherExpanded)}
                              style={{
                                width: '100%',
                                backgroundColor: isOtherExpanded ? '#ffffff' : '#f5efe6',
                                border: '1px solid #e2d2bc',
                                borderRadius: '6px',
                                color: 'var(--walnut)',
                                fontSize: '0.8125rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                padding: '6px 10px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span>{isOtherExpanded ? '▼' : '▶'}</span>
                                <span>Custom Categories Breakdown</span>
                              </span>
                              <span
                                style={{
                                  backgroundColor: 'var(--papaya-whip)',
                                  color: 'var(--walnut)',
                                  padding: '1px 7px',
                                  borderRadius: '10px',
                                  fontSize: '0.6875rem',
                                  fontWeight: 700,
                                }}
                              >
                                {cat.customCategories.length}
                              </span>
                            </button>

                            {isOtherExpanded && (
                              <div
                                data-testid="other-categories-drilldown"
                                style={{
                                  marginTop: '0.75rem',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '0.625rem',
                                }}
                              >
                                {cat.customCategories.map((sub) => (
                                  <div
                                    key={sub.category}
                                    style={{
                                      backgroundColor: '#ffffff',
                                      borderRadius: '8px',
                                      border: '1px solid #ebdcc5',
                                      padding: '10px 12px',
                                      boxShadow: '0 1px 3px rgba(114, 67, 25, 0.04)',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '5px',
                                    }}
                                  >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <span style={{ fontWeight: 700, color: 'var(--walnut)', fontSize: '0.875rem' }}>
                                        {sub.category}
                                      </span>
                                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--walnut)' }}>
                                        {sub.completionRate}% completion
                                      </span>
                                    </div>

                                    {/* Mini completion bar */}
                                    <div style={{ height: '5px', backgroundColor: '#f0e6d6', borderRadius: '3px', overflow: 'hidden' }}>
                                      <div
                                        style={{
                                          width: `${Math.min(100, Math.max(0, sub.completionRate))}%`,
                                          height: '100%',
                                          backgroundColor: 'var(--walnut)',
                                          borderRadius: '3px',
                                        }}
                                      />
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                                      <span>{sub.challengesCount} {sub.challengesCount === 1 ? 'challenge' : 'challenges'}</span>
                                      <span>{sub.totalEnrollments} {sub.totalEnrollments === 1 ? 'enrollment' : 'enrollments'}</span>
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
        @media (max-width: 1024px) {
          .manager-dashboard-columns {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};
