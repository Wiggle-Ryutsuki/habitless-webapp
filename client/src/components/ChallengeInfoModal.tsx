import React, { useState, useEffect, useRef } from 'react';
import {
  PublicChallenge,
  ChallengeCommentItem,
} from '../types/challenge.types.js';
import {
  fetchPublicChallenge,
  joinChallenge,
  leaveChallenge,
  syncChallenge,
  rateChallenge,
  postChallengeComment,
  ChallengeApiError,
} from '../services/challenges.service.js';
import { getFrequencyLabel, getInitialDaysOfWeek } from './DayOfWeekSelector.js';

export interface ChallengeInfoModalProps {
  isOpen: boolean;
  programId: number | null;
  initialChallengeStatus?: 'ACTIVE' | 'ENDED' | null;
  onClose: () => void;
  onEnrollmentChanged?: () => void;
  triggerElement?: HTMLElement | null;
}

export const ChallengeInfoModal: React.FC<ChallengeInfoModalProps> = ({
  isOpen,
  programId,
  initialChallengeStatus,
  onClose,
  onEnrollmentChanged,
  triggerElement,
}) => {
  const [challenge, setChallenge] = useState<PublicChallenge | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Leave / Keep prompt state
  const [showLeavePrompt, setShowLeavePrompt] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Rating state
  const [myRating, setMyRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [ratingLoading, setRatingLoading] = useState<boolean>(false);

  // Comment state
  const [commentText, setCommentText] = useState<string>('');
  const [commentSubmitting, setCommentSubmitting] = useState<boolean>(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  const closeBtnRef = useRef<HTMLButtonElement>(null);

  const loadChallenge = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchPublicChallenge(id);
      setChallenge(data);
      setMyRating(data.myRating ?? null);
      if (initialChallengeStatus === 'ENDED' || data.myEnrollment?.hasUnresolvedEndedHabits) {
        setShowLeavePrompt(true);
      }
    } catch (err: any) {
      setError(err instanceof ChallengeApiError ? err.message : 'Failed to load challenge details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && programId) {
      setShowLeavePrompt(initialChallengeStatus === 'ENDED');
      setActionSuccessMessage(null);
      setCommentText('');
      setCommentError(null);
      loadChallenge(programId);
    } else {
      setChallenge(null);
      setError(null);
    }
  }, [isOpen, programId, initialChallengeStatus]);

  useEffect(() => {
    if (isOpen && !loading) {
      closeBtnRef.current?.focus();
    }
  }, [isOpen, loading]);

  const handleClose = () => {
    if (actionLoading || commentSubmitting) return;
    onClose();
    if (triggerElement) {
      setTimeout(() => triggerElement.focus(), 50);
    }
  };

  const handleJoin = async () => {
    if (!programId) return;
    try {
      setActionLoading(true);
      setError(null);
      await joinChallenge(programId);
      setActionSuccessMessage('Successfully joined challenge! Curriculum habits added.');
      await loadChallenge(programId);
      onEnrollmentChanged?.();
    } catch (err: any) {
      setError(err instanceof ChallengeApiError ? err.message : 'Failed to join challenge.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async (action: 'KEEP' | 'REMOVE') => {
    if (!programId) return;
    try {
      setActionLoading(true);
      setError(null);
      const res = await leaveChallenge(programId, action);
      setActionSuccessMessage(res.message);
      setShowLeavePrompt(false);
      await loadChallenge(programId);
      onEnrollmentChanged?.();
    } catch (err: any) {
      setError(err instanceof ChallengeApiError ? err.message : 'Failed to leave challenge.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSync = async () => {
    if (!programId) return;
    try {
      setActionLoading(true);
      setError(null);
      await syncChallenge(programId);
      setActionSuccessMessage('Challenge curriculum synced successfully with updated template!');
      await loadChallenge(programId);
      onEnrollmentChanged?.();
    } catch (err: any) {
      setError(err instanceof ChallengeApiError ? err.message : 'Failed to sync challenge.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRate = async (star: number) => {
    if (!programId || ratingLoading) return;
    try {
      setRatingLoading(true);
      const res = await rateChallenge(programId, star);
      setMyRating(res.rating);
      setChallenge((prev) =>
        prev
          ? {
              ...prev,
              averageRating: res.averageRating,
              ratingsCount: res.ratingsCount,
              myRating: res.rating,
            }
          : null
      );
    } catch (err: any) {
      setError(err instanceof ChallengeApiError ? err.message : 'Failed to submit rating.');
    } finally {
      setRatingLoading(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!programId || !commentText.trim() || commentSubmitting) return;

    try {
      setCommentSubmitting(true);
      setCommentError(null);
      const newComment = await postChallengeComment(programId, commentText.trim(), null);
      setCommentText('');
      setChallenge((prev) =>
        prev
          ? {
              ...prev,
              comments: [newComment, ...(prev.comments || [])],
            }
          : null
      );
    } catch (err: any) {
      setCommentError(err instanceof ChallengeApiError ? err.message : 'Failed to post comment.');
    } finally {
      setCommentSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const isEnded =
    initialChallengeStatus === 'ENDED' ||
    challenge?.myEnrollment?.hasUnresolvedEndedHabits ||
    (challenge && challenge.status !== 'PUBLISHED');

  const isEnrolled = challenge?.myEnrollment?.status === 'ACTIVE';
  const canRateAndComment = isEnrolled || challenge?.myEnrollment?.status === 'COMPLETED';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="challenge-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '12px',
          maxWidth: '680px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #eee',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            backgroundColor: '#faf8f5',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '12px',
                  backgroundColor: isEnded ? '#ffebee' : '#fff8e1',
                  color: isEnded ? '#c62828' : '#b78103',
                  border: `1px solid ${isEnded ? '#ef9a9a' : '#ffe082'}`,
                }}
              >
                {isEnded ? 'Challenge (Ended)' : 'Challenge'}
              </span>

              {challenge?.category && (
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
                  {challenge.category}
                </span>
              )}
            </div>

            <h2
              id="challenge-modal-title"
              style={{
                margin: 0,
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#2d3748',
              }}
            >
              {challenge ? challenge.title : 'Loading challenge...'}
            </h2>
          </div>

          <button
            ref={closeBtnRef}
            onClick={handleClose}
            aria-label="Close modal"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#718096',
              padding: '4px 8px',
              borderRadius: '4px',
            }}
          >
            ×
          </button>
        </div>

        {/* Content Body */}
        <div
          style={{
            padding: '1.5rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          {loading && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#718096' }}>
              Loading challenge details...
            </div>
          )}

          {error && (
            <div
              role="alert"
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: '#fff5f5',
                color: '#c53030',
                borderRadius: '8px',
                border: '1px solid #feb2b2',
                fontSize: '0.875rem',
              }}
            >
              {error}
            </div>
          )}

          {actionSuccessMessage && (
            <div
              role="status"
              style={{
                padding: '0.75rem 1rem',
                backgroundColor: '#f0fff4',
                color: '#276749',
                borderRadius: '8px',
                border: '1px solid #9ae6b4',
                fontSize: '0.875rem',
              }}
            >
              {actionSuccessMessage}
            </div>
          )}

          {challenge && !loading && (
            <>
              {/* Update Available Banner */}
              {challenge.myEnrollment?.updateAvailable && (
                <div
                  data-testid="update-available-banner"
                  style={{
                    backgroundColor: '#fffaf0',
                    border: '1px solid #feebc8',
                    borderRadius: '8px',
                    padding: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <strong style={{ color: '#c05621', display: 'block', fontSize: '0.9375rem' }}>
                      Update Available
                    </strong>
                    <span style={{ fontSize: '0.8125rem', color: '#7b341e' }}>
                      The organizer made improvements to this challenge template (v{challenge.version}).
                    </span>
                  </div>
                  <button
                    onClick={handleSync}
                    disabled={actionLoading}
                    aria-label="Sync Changes"
                    style={{
                      backgroundColor: '#dd6b20',
                      color: '#fff',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      cursor: actionLoading ? 'not-allowed' : 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {actionLoading ? 'Syncing...' : 'Sync Changes'}
                  </button>
                </div>
              )}

              {/* Keep vs Remove Prompt Banner */}
              {showLeavePrompt && (
                <div
                  data-testid="keep-remove-prompt"
                  style={{
                    backgroundColor: isEnded ? '#fff5f5' : '#f7fafc',
                    border: `1px solid ${isEnded ? '#feb2b2' : '#e2e8f0'}`,
                    borderRadius: '8px',
                    padding: '1rem',
                  }}
                >
                  <p
                    style={{
                      margin: '0 0 0.75rem 0',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: isEnded ? '#9b2c2c' : '#2d3748',
                    }}
                  >
                    {isEnded
                      ? 'This challenge has ended or was unpublished. Choose how to handle your enrolled habits:'
                      : 'Choose how to handle your enrolled habits before leaving:'}
                  </p>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => handleLeave('KEEP')}
                      disabled={actionLoading}
                      aria-label="Keep as Personal Habits"
                      style={{
                        backgroundColor: '#2b6cb0',
                        color: '#fff',
                        border: 'none',
                        padding: '8px 14px',
                        borderRadius: '6px',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        cursor: actionLoading ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Keep as Personal Habits
                    </button>
                    <button
                      onClick={() => handleLeave('REMOVE')}
                      disabled={actionLoading}
                      aria-label="Remove Habits"
                      style={{
                        backgroundColor: '#e53e3e',
                        color: '#fff',
                        border: 'none',
                        padding: '8px 14px',
                        borderRadius: '6px',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        cursor: actionLoading ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Remove Habits
                    </button>
                    {!isEnded && (
                      <button
                        onClick={() => setShowLeavePrompt(false)}
                        disabled={actionLoading}
                        style={{
                          backgroundColor: 'transparent',
                          color: '#4a5568',
                          border: '1px solid #cbd5e0',
                          padding: '8px 14px',
                          borderRadius: '6px',
                          fontSize: '0.8125rem',
                          cursor: 'pointer',
                        }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Active Enrollment Countdown Banner */}
              {isEnrolled && challenge.myEnrollment && (
                <div
                  style={{
                    backgroundColor: '#ebf8ff',
                    border: '1px solid #bee3f8',
                    borderRadius: '8px',
                    padding: '0.875rem 1rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.75rem',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2b6cb0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Active Challenge Countdown
                    </div>
                    <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#2c5282' }}>
                      {challenge.myEnrollment.daysRemaining !== undefined && challenge.myEnrollment.daysRemaining > 0
                        ? `⏱️ ${challenge.myEnrollment.daysRemaining} days remaining`
                        : challenge.myEnrollment.isCompleted
                        ? '🏁 Challenge Completed'
                        : '⏱️ Final Day!'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#4a5568' }}>
                      Enrolled on {new Date(challenge.myEnrollment.enrolledAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div
                    style={{
                      backgroundColor: '#3182ce',
                      color: '#ffffff',
                      fontWeight: 800,
                      padding: '6px 14px',
                      borderRadius: '20px',
                      fontSize: '0.875rem',
                    }}
                  >
                    Day {challenge.myEnrollment.currentDay ?? 1} of {challenge.durationDays || 30}
                  </div>
                </div>
              )}

              {/* Metadata Details */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                  gap: '0.75rem',
                  fontSize: '0.8125rem',
                  color: '#4a5568',
                  backgroundColor: '#f7fafc',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                }}
              >
                <div>
                  <strong>Organizer:</strong> {challenge.manager?.fullName || 'Program Manager'}
                </div>
                <div>
                  <strong>Duration:</strong> {challenge.durationDays || 30} Days
                  <span style={{ display: 'block', fontSize: '0.75rem', color: '#718096' }}>
                    Starts on acceptance
                  </span>
                </div>
                <div>
                  <strong>Version:</strong> v{challenge.version}
                </div>
                <div>
                  <strong>Enrollments:</strong> {challenge.enrollmentsCount ?? 0}
                </div>
              </div>

              {/* Description */}
              {challenge.description && (
                <div style={{ fontSize: '0.875rem', color: '#4a5568', lineHeight: 1.5 }}>
                  {challenge.description}
                </div>
              )}

              {/* Star Rating Summary & Interactive Rating Widget */}
              <div
                style={{
                  borderTop: '1px solid #edf2f7',
                  borderBottom: '1px solid #edf2f7',
                  padding: '1rem 0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '1.25rem', color: '#ecc94b', fontWeight: 700 }}>★</span>
                    <strong style={{ fontSize: '1.125rem', color: '#2d3748' }}>
                      {challenge.averageRating > 0 ? challenge.averageRating.toFixed(1) : 'No ratings'}
                    </strong>
                    <span style={{ fontSize: '0.8125rem', color: '#718096' }}>
                      ({challenge.ratingsCount} {challenge.ratingsCount === 1 ? 'rating' : 'ratings'})
                    </span>
                  </div>
                </div>

                {canRateAndComment && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.8125rem', color: '#4a5568', fontWeight: 600 }}>
                      {myRating ? 'Your rating:' : 'Rate challenge:'}
                    </span>
                    <div style={{ display: 'flex', gap: '2px' }}>
                      {[1, 2, 3, 4, 5].map((star) => {
                        const active = (hoverRating ?? myRating ?? 0) >= star;
                        return (
                          <button
                            key={star}
                            type="button"
                            onClick={() => handleRate(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(null)}
                            aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                            disabled={ratingLoading}
                            style={{
                              background: 'none',
                              border: 'none',
                              cursor: ratingLoading ? 'not-allowed' : 'pointer',
                              fontSize: '1.35rem',
                              color: active ? '#ecc94b' : '#cbd5e0',
                              padding: '2px',
                              lineHeight: 1,
                            }}
                          >
                            ★
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Curriculum Activities */}
              <div>
                <h3
                  style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    margin: '0 0 0.75rem 0',
                    color: '#2d3748',
                  }}
                >
                  Curriculum Activities ({challenge.activities?.length ?? 0})
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {(challenge.activities || []).map((act, idx) => (
                    <div
                      key={act.id || idx}
                      style={{
                        padding: '0.75rem 1rem',
                        backgroundColor: '#faf8f5',
                        borderRadius: '6px',
                        border: '1px solid #eee',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'baseline',
                        }}
                      >
                        <strong style={{ fontSize: '0.875rem', color: '#2d3748' }}>
                          {act.title}
                        </strong>
                        <span style={{ fontSize: '0.75rem', color: '#718096', fontWeight: 600 }}>
                          {getFrequencyLabel(getInitialDaysOfWeek(act.frequency, act.daysOfWeek))}
                        </span>
                      </div>
                      {act.description && (
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.8125rem', color: '#718096' }}>
                          {act.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Comment Thread & Discussion */}
              <div style={{ borderTop: '1px solid #edf2f7', paddingTop: '1rem' }}>
                <h3
                  style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    margin: '0 0 0.75rem 0',
                    color: '#2d3748',
                  }}
                >
                  Discussion ({challenge.comments?.length ?? 0})
                </h3>

                {/* Top-level comment submission (for active/completed participants) */}
                {canRateAndComment && (
                  <form onSubmit={handleCommentSubmit} style={{ marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <textarea
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Share your experience or ask a question..."
                        maxLength={500}
                        rows={3}
                        aria-label="Comment content"
                        style={{
                          width: '100%',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e0',
                          fontSize: '0.875rem',
                          fontFamily: 'inherit',
                          resize: 'vertical',
                          boxSizing: 'border-box',
                        }}
                      />
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <span style={{ fontSize: '0.75rem', color: '#a0aec0' }}>
                          {500 - commentText.length} characters remaining
                        </span>
                        <button
                          type="submit"
                          disabled={commentSubmitting || !commentText.trim()}
                          aria-label="Post comment"
                          style={{
                            backgroundColor: '#3182ce',
                            color: '#fff',
                            border: 'none',
                            padding: '6px 14px',
                            borderRadius: '6px',
                            fontSize: '0.8125rem',
                            fontWeight: 600,
                            cursor: commentSubmitting || !commentText.trim() ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {commentSubmitting ? 'Posting...' : 'Post Comment'}
                        </button>
                      </div>
                    </div>
                    {commentError && (
                      <div style={{ color: '#e53e3e', fontSize: '0.75rem', marginTop: '4px' }}>
                        {commentError}
                      </div>
                    )}
                  </form>
                )}

                {/* Comment List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {(!challenge.comments || challenge.comments.length === 0) && (
                    <div style={{ color: '#a0aec0', fontSize: '0.8125rem', fontStyle: 'italic' }}>
                      No comments yet. Be the first to share your experience!
                    </div>
                  )}

                  {(challenge.comments || []).map((c: ChallengeCommentItem) => (
                    <div
                      key={c.id}
                      style={{
                        padding: '0.75rem 1rem',
                        backgroundColor: '#f7fafc',
                        borderRadius: '8px',
                        border: '1px solid #edf2f7',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '4px',
                        }}
                      >
                        <strong style={{ fontSize: '0.8125rem', color: '#2d3748' }}>
                          {c.author.fullName}
                        </strong>
                        <span style={{ fontSize: '0.75rem', color: '#a0aec0' }}>
                          {new Date(c.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p style={{ margin: '0 0 6px 0', fontSize: '0.875rem', color: '#4a5568' }}>
                        {c.content}
                      </p>

                      {/* Nested Replies */}
                      {c.replies && c.replies.length > 0 && (
                        <div
                          style={{
                            marginLeft: '1rem',
                            marginTop: '0.5rem',
                            borderLeft: '2px solid #cbd5e0',
                            paddingLeft: '0.75rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.5rem',
                          }}
                        >
                          {c.replies.map((reply) => (
                            <div key={reply.id} style={{ backgroundColor: '#fff', padding: '6px 10px', borderRadius: '6px' }}>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  marginBottom: '2px',
                                }}
                              >
                                <strong style={{ fontSize: '0.75rem', color: '#2b6cb0' }}>
                                  {reply.author.fullName}
                                </strong>
                                <span
                                  style={{
                                    fontSize: '0.6875rem',
                                    fontWeight: 700,
                                    color: '#2b6cb0',
                                    backgroundColor: '#ebf8ff',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                  }}
                                >
                                  Organizer
                                </span>
                              </div>
                              <p style={{ margin: 0, fontSize: '0.8125rem', color: '#4a5568' }}>
                                {reply.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid #eee',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            backgroundColor: '#faf8f5',
          }}
        >
          {challenge && isEnrolled && !showLeavePrompt && !isEnded && (
            <button
              onClick={() => setShowLeavePrompt(true)}
              disabled={actionLoading}
              aria-label="Leave Challenge"
              style={{
                backgroundColor: 'transparent',
                color: '#e53e3e',
                border: '1px solid #feb2b2',
                padding: '8px 16px',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              Leave Challenge
            </button>
          )}

          {challenge && !isEnrolled && !isEnded && challenge.status === 'PUBLISHED' && (
            <button
              onClick={handleJoin}
              disabled={actionLoading}
              aria-label="Join Challenge"
              style={{
                backgroundColor: '#319795',
                color: '#fff',
                border: 'none',
                padding: '8px 20px',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: actionLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {actionLoading
                ? 'Joining...'
                : challenge.myEnrollment?.status === 'LEFT'
                ? 'Re-Join Challenge'
                : 'Join Challenge'}
            </button>
          )}

          <button
            onClick={handleClose}
            style={{
              backgroundColor: '#edf2f7',
              color: '#4a5568',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
