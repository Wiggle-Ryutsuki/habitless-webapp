import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header.js';
import { ManagerDirectoryDetail, ChallengeCommentItem } from '../types/challenge.types.js';
import {
  fetchManagerDirectoryDetail,
  postManagerReply,
  ManagerApiError,
} from '../services/manager.service.js';
import { getFrequencyLabel } from '../components/DayOfWeekSelector.js';

export const ManagerChallengeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [challenge, setChallenge] = useState<ManagerDirectoryDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Reply state
  const [replyingCommentId, setReplyingCommentId] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState<string>('');
  const [submittingReply, setSubmittingReply] = useState<boolean>(false);
  const [replyError, setReplyError] = useState<string | null>(null);

  useEffect(() => {
    loadChallenge();
  }, [id]);

  const loadChallenge = async () => {
    if (!id || isNaN(Number(id))) {
      setError('Invalid challenge ID.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await fetchManagerDirectoryDetail(Number(id));
      setChallenge(data);
    } catch (err: any) {
      setError(err instanceof ManagerApiError ? err.message : 'Failed to load challenge details.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReply = (commentId: number) => {
    setReplyingCommentId(commentId);
    setReplyContent('');
    setReplyError(null);
  };

  const handleCancelReply = () => {
    setReplyingCommentId(null);
    setReplyContent('');
    setReplyError(null);
  };

  const handleSubmitReply = async (commentId: number) => {
    if (!challenge) return;
    if (!replyContent.trim()) {
      setReplyError('Reply cannot be empty.');
      return;
    }
    if (replyContent.trim().length > 500) {
      setReplyError('Reply cannot exceed 500 characters.');
      return;
    }

    try {
      setSubmittingReply(true);
      setReplyError(null);
      const newReply = await postManagerReply(challenge.id, commentId, replyContent.trim());

      // Update challenge comments locally
      const updatedComments = challenge.comments.map((c) => {
        if (c.id === commentId) {
          return {
            ...c,
            replies: [...(c.replies || []), newReply],
          };
        }
        return c;
      });

      setChallenge({
        ...challenge,
        comments: updatedComments,
      });

      setReplyingCommentId(null);
      setReplyContent('');
    } catch (err: any) {
      setReplyError(err instanceof ManagerApiError ? err.message : 'Failed to post reply.');
    } finally {
      setSubmittingReply(false);
    }
  };

  return (
    <div data-testid="manager-challenge-detail-page" style={{ minHeight: '100vh', backgroundColor: 'var(--color-background)' }}>
      <Header />

      <main style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Navigation Bar */}
        <div style={{ marginBottom: '1.5rem' }}>
          <button
            type="button"
            data-testid="back-to-directory-btn"
            onClick={() => navigate('/manager/challenges')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'transparent',
              border: '1px solid var(--walnut)',
              color: 'var(--walnut)',
              padding: '6px 14px',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            ← Back to Directory
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--color-text-muted)' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>⏳</div>
            Loading challenge details...
          </div>
        ) : error ? (
          <div
            style={{
              backgroundColor: '#fee2e2',
              color: '#991b1b',
              padding: '1.5rem',
              borderRadius: '12px',
              border: '1px solid #fecaca',
              textAlign: 'center',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '1.125rem', marginBottom: '0.5rem' }}>
              Challenge Not Available
            </div>
            <div>{error}</div>
          </div>
        ) : challenge ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Challenge Header Card */}
            <div
              style={{
                backgroundColor: 'var(--color-surface)',
                borderRadius: '14px',
                border: '1px solid var(--papaya-whip)',
                boxShadow: '0 4px 14px rgba(114, 67, 25, 0.05)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  backgroundColor: 'var(--walnut)',
                  color: '#fff',
                  padding: '1.5rem 2rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                    <span
                      style={{
                        backgroundColor: 'var(--golden-sand)',
                        color: 'var(--walnut)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: '10px',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {challenge.category}
                    </span>
                    {challenge.isOwnedByMe && (
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
                    <span
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.2)',
                        color: '#fff',
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '6px',
                      }}
                    >
                      {challenge.status}
                    </span>
                  </div>

                  <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.25rem 0', color: '#fff' }}>
                    {challenge.title}
                  </h1>
                  <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                    Created by <strong>{challenge.manager.fullName}</strong>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    padding: '10px 16px',
                    borderRadius: '8px',
                    textAlign: 'right',
                  }}
                >
                  <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
                    {challenge.durationDays} Days
                  </div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>Program Duration</div>
                </div>
              </div>

              {/* Stats Bar */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  borderBottom: '1px solid var(--papaya-whip)',
                  backgroundColor: '#fffdfa',
                }}
              >
                <div style={{ padding: '1rem 1.5rem', borderRight: '1px solid var(--papaya-whip)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                    Total Enrollments
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--walnut)', marginTop: '2px' }}>
                    {challenge.enrollmentsCount}
                  </div>
                </div>

                <div style={{ padding: '1rem 1.5rem', borderRight: '1px solid var(--papaya-whip)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                    Curriculum Activities
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--walnut)', marginTop: '2px' }}>
                    {challenge.activities.length}
                  </div>
                </div>

                <div style={{ padding: '1rem 1.5rem' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                    Community Rating
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    <span style={{ color: '#f59e0b', fontSize: '1.125rem' }}>★</span>
                    <strong style={{ fontSize: '1.25rem', color: 'var(--walnut)' }}>
                      {challenge.averageRating > 0 ? challenge.averageRating.toFixed(1) : '—'}
                    </strong>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                      ({challenge.ratingsCount} reviews)
                    </span>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div style={{ padding: '1.5rem 2rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--walnut)', margin: '0 0 0.5rem 0' }}>
                  About this Challenge
                </h3>
                <p style={{ margin: 0, color: 'var(--color-text-main)', lineHeight: 1.6, fontSize: '0.9375rem' }}>
                  {challenge.description || 'No description provided by the manager.'}
                </p>
              </div>
            </div>

            {/* Curriculum Activities */}
            <div
              style={{
                backgroundColor: 'var(--color-surface)',
                borderRadius: '14px',
                border: '1px solid var(--papaya-whip)',
                padding: '1.5rem 2rem',
                boxShadow: '0 4px 14px rgba(114, 67, 25, 0.05)',
              }}
            >
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--walnut)', margin: '0 0 1rem 0' }}>
                Curriculum Activities ({challenge.activities.length})
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {challenge.activities.map((act, idx) => (
                  <div
                    key={act.id}
                    style={{
                      padding: '1rem',
                      backgroundColor: '#fffdfa',
                      borderRadius: '8px',
                      border: '1px solid var(--papaya-whip)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.25rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--walnut)', fontSize: '0.9375rem' }}>
                        {idx + 1}. {act.title}
                      </div>
                      <span
                        style={{
                          backgroundColor: 'var(--papaya-whip)',
                          color: 'var(--walnut)',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: '6px',
                        }}
                      >
                        {act.daysOfWeek && act.daysOfWeek.length > 0
                          ? getFrequencyLabel(act.daysOfWeek)
                          : act.frequency}
                      </span>
                    </div>

                    {act.description && (
                      <p style={{ margin: '0.25rem 0 0.5rem 0', color: 'var(--color-text-muted)', fontSize: '0.8125rem', lineHeight: 1.4 }}>
                        {act.description}
                      </p>
                    )}

                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                      Target: <strong>{act.targetCount}</strong> time{act.targetCount > 1 ? 's' : ''} per scheduled day
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comments & Discussion */}
            <div
              style={{
                backgroundColor: 'var(--color-surface)',
                borderRadius: '14px',
                border: '1px solid var(--papaya-whip)',
                padding: '1.5rem 2rem',
                boxShadow: '0 4px 14px rgba(114, 67, 25, 0.05)',
              }}
            >
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--walnut)', margin: '0 0 1rem 0' }}>
                Participant Discussions & Comments ({challenge.comments.length})
              </h2>

              {challenge.comments.length === 0 ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                  No participant comments posted yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {challenge.comments.map((comment) => (
                    <div
                      key={comment.id}
                      style={{
                        padding: '1rem',
                        backgroundColor: '#fffdfa',
                        borderRadius: '8px',
                        border: '1px solid var(--papaya-whip)',
                      }}
                    >
                      {/* Comment Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, color: 'var(--walnut)', fontSize: '0.9375rem' }}>
                            {comment.author.fullName}
                          </span>
                          <span
                            style={{
                              fontSize: '0.6875rem',
                              fontWeight: 600,
                              padding: '2px 6px',
                              borderRadius: '6px',
                              backgroundColor: comment.author.role === 'PROGRAM_MANAGER' ? 'var(--golden-sand)' : 'var(--papaya-whip)',
                              color: 'var(--walnut)',
                            }}
                          >
                            {comment.author.role === 'PROGRAM_MANAGER' ? 'Manager' : 'Participant'}
                          </span>
                        </div>

                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Comment Content */}
                      <p style={{ margin: '0 0 0.75rem 0', color: 'var(--color-text-main)', fontSize: '0.875rem', lineHeight: 1.5 }}>
                        {comment.content}
                      </p>

                      {/* Nested Replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div
                          style={{
                            marginLeft: '1.5rem',
                            marginTop: '0.75rem',
                            paddingLeft: '1rem',
                            borderLeft: '2px solid var(--papaya-whip)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.75rem',
                          }}
                        >
                          {comment.replies.map((reply) => (
                            <div
                              key={reply.id}
                              style={{
                                backgroundColor: '#ffffff',
                                padding: '0.75rem 1rem',
                                borderRadius: '6px',
                                border: '1px solid #f0e6d6',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <strong style={{ fontSize: '0.8125rem', color: 'var(--walnut)' }}>
                                    {reply.author.fullName}
                                  </strong>
                                  <span
                                    style={{
                                      fontSize: '0.625rem',
                                      fontWeight: 700,
                                      padding: '1px 5px',
                                      borderRadius: '4px',
                                      backgroundColor: 'var(--golden-sand)',
                                      color: 'var(--walnut)',
                                    }}
                                  >
                                    Manager Reply
                                  </span>
                                </div>
                                <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>
                                  {new Date(reply.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-text-main)', lineHeight: 1.4 }}>
                                {reply.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Reply Button & Inline Form */}
                      <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {replyingCommentId !== comment.id ? (
                          <div>
                            <button
                              type="button"
                              data-testid={`reply-btn-${comment.id}`}
                              onClick={() => handleOpenReply(comment.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--walnut)',
                                fontSize: '0.8125rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                                padding: '4px 0',
                                textDecoration: 'underline',
                              }}
                            >
                              Reply as Manager
                            </button>
                          </div>
                        ) : (
                          <div
                            style={{
                              marginTop: '0.5rem',
                              backgroundColor: '#ffffff',
                              padding: '0.75rem',
                              borderRadius: '8px',
                              border: '1px solid #d4be93',
                            }}
                          >
                            <textarea
                              data-testid={`reply-textarea-${comment.id}`}
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              placeholder="Write a helpful response to this participant comment..."
                              rows={3}
                              style={{
                                width: '100%',
                                padding: '8px',
                                borderRadius: '6px',
                                border: '1px solid #d4be93',
                                fontSize: '0.875rem',
                                resize: 'vertical',
                                boxSizing: 'border-box',
                              }}
                            />

                            {replyError && (
                              <div style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '4px' }}>
                                {replyError}
                              </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                              <button
                                type="button"
                                data-testid={`cancel-reply-btn-${comment.id}`}
                                onClick={handleCancelReply}
                                disabled={submittingReply}
                                style={{
                                  backgroundColor: 'transparent',
                                  border: '1px solid #9e9e9e',
                                  color: '#666',
                                  padding: '5px 12px',
                                  borderRadius: '6px',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                data-testid={`submit-reply-btn-${comment.id}`}
                                onClick={() => handleSubmitReply(comment.id)}
                                disabled={submittingReply || !replyContent.trim()}
                                style={{
                                  backgroundColor: 'var(--walnut)',
                                  color: '#fff',
                                  border: 'none',
                                  padding: '5px 14px',
                                  borderRadius: '6px',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  cursor: submittingReply || !replyContent.trim() ? 'not-allowed' : 'pointer',
                                  opacity: submittingReply || !replyContent.trim() ? 0.7 : 1,
                                }}
                              >
                                {submittingReply ? 'Posting...' : 'Post Reply'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
};
