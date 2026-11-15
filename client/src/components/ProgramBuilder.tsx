import React, { useState, useEffect } from 'react';
import {
  ChallengeProgram,
  CreateProgramPayload,
} from '../types/challenge.types.js';
import { FrequencyType } from '../types/habit.js';
import {
  DayOfWeekSelector,
  deriveFrequencyType,
  getInitialDaysOfWeek,
} from './DayOfWeekSelector.js';
import {
  fetchManagerPrograms,
  createProgram,
  updateProgram,
  deployProgram,
  unpublishProgram,
  archiveProgram,
  deleteProgram,
  ManagerApiError,
} from '../services/manager.service.js';

interface ActivityFormItem {
  title: string;
  description: string;
  frequency: FrequencyType;
  daysOfWeek: number[];
  targetCount: number;
}

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  confirmVariant?: 'primary' | 'danger';
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
}

const CATEGORIES = [
  'Wellness',
  'Fitness',
  'Mindfulness',
  'Nutrition',
  'Productivity',
  'Other',
];

export const ProgramBuilder: React.FC = () => {
  const [programs, setPrograms] = useState<ChallengeProgram[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [deployingId, setDeployingId] = useState<number | null>(null);
  const [unpublishingId, setUnpublishingId] = useState<number | null>(null);
  const [archivingId, setArchivingId] = useState<number | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal Dialog State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProgramId, setEditingProgramId] = useState<number | null>(null);
  const [isPreviouslyPublished, setIsPreviouslyPublished] = useState<boolean>(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  // Form State
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<string>('Wellness');
  const [description, setDescription] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [activities, setActivities] = useState<ActivityFormItem[]>([
    {
      title: '',
      description: '',
      frequency: 'DAILY',
      daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
      targetCount: 1,
    },
  ]);

  useEffect(() => {
    loadPrograms();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const loadPrograms = async () => {
    try {
      setLoading(true);
      const data = await fetchManagerPrograms();
      setPrograms(data);
      setErrorMessage(null);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load challenge programs.');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingProgramId(null);
    setIsPreviouslyPublished(false);
    setTitle('');
    setCategory('Wellness');
    setDescription('');
    setStartDate('');
    setEndDate('');
    setActivities([
      {
        title: '',
        description: '',
        frequency: 'DAILY',
        daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
        targetCount: 1,
      },
    ]);
    setFieldErrors({});
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const handleEditDraft = (prog: ChallengeProgram) => {
    setEditingProgramId(prog.id);
    setIsPreviouslyPublished(Boolean(prog.previouslyPublished));
    setTitle(prog.title);
    setCategory(prog.category);
    setDescription(prog.description || '');
    setStartDate(prog.startDate.split('T')[0]);
    setEndDate(prog.endDate.split('T')[0]);

    if (prog.activities && prog.activities.length > 0) {
      setActivities(
        prog.activities.map((a) => {
          const days = getInitialDaysOfWeek(a.frequency, a.daysOfWeek);
          return {
            title: a.title,
            description: a.description || '',
            frequency: a.frequency || deriveFrequencyType(days),
            daysOfWeek: days,
            targetCount: a.targetCount,
          };
        })
      );
    } else {
      setActivities([
        {
          title: '',
          description: '',
          frequency: 'DAILY',
          daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
          targetCount: 1,
        },
      ]);
    }
    setFieldErrors({});
    setErrorMessage(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProgramId(null);
    setIsPreviouslyPublished(false);
    setFieldErrors({});
  };

  const handleAddActivity = () => {
    setActivities([
      ...activities,
      {
        title: '',
        description: '',
        frequency: 'DAILY',
        daysOfWeek: [1, 2, 3, 4, 5, 6, 7],
        targetCount: 1,
      },
    ]);
  };

  const handleRemoveActivity = (index: number) => {
    if (activities.length <= 1) return;
    setActivities(activities.filter((_, i) => i !== index));
  };

  const handleActivityChange = (index: number, field: keyof ActivityFormItem, val: any) => {
    const updated = [...activities];
    updated[index] = {
      ...updated[index],
      [field]: val,
    };
    setActivities(updated);
  };

  const handleActivityDaysChange = (index: number, days: number[]) => {
    const updated = [...activities];
    updated[index] = {
      ...updated[index],
      daysOfWeek: days,
      frequency: deriveFrequencyType(days),
    };
    setActivities(updated);
  };

  const validateClientSide = (): boolean => {
    const errors: Record<string, string> = {};

    if (!title.trim()) {
      errors.title = 'Title is required.';
    } else if (title.trim().length < 3 || title.trim().length > 100) {
      errors.title = 'Title must be between 3 and 100 characters.';
    }

    if (!category.trim()) {
      errors.category = 'Category is required.';
    }

    if (description.trim().length > 500) {
      errors.description = 'Description cannot exceed 500 characters.';
    }

    if (!startDate) {
      errors.startDate = 'Start date is required.';
    }

    if (!endDate) {
      errors.endDate = 'End date is required.';
    }

    if (startDate && endDate) {
      const s = new Date(startDate);
      const e = new Date(endDate);
      if (e < s) {
        errors.endDate = 'End date must be on or after start date.';
      }
    }

    if (!activities || activities.length === 0) {
      errors.activities = 'At least 1 activity is required.';
    } else {
      activities.forEach((act, idx) => {
        if (!act.title.trim()) {
          errors[`activities[${idx}].title`] = `Activity ${idx + 1} title is required.`;
        } else if (act.title.trim().length < 2 || act.title.trim().length > 80) {
          errors[`activities[${idx}].title`] = `Activity ${idx + 1} title must be between 2 and 80 characters.`;
        }
        if (act.description && act.description.trim().length > 500) {
          errors[`activities[${idx}].description`] = `Activity ${idx + 1} description cannot exceed 500 characters.`;
        }
      });
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRequestCancel = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Cancel Challenge Creation?',
      message: 'Are you sure you want to cancel? Any unsaved changes will be lost.',
      confirmLabel: 'Discard Changes',
      cancelLabel: 'Resume Editing',
      confirmVariant: 'danger',
      onConfirm: () => {
        closeModal();
      },
    });
  };

  const buildPayload = (): CreateProgramPayload => ({
    title: title.trim(),
    category: category.trim(),
    description: description.trim() ? description.trim() : null,
    startDate: new Date(startDate).toISOString(),
    endDate: new Date(endDate).toISOString(),
    activities: activities.map((a) => ({
      title: a.title.trim(),
      description: a.description.trim() ? a.description.trim() : null,
      frequency: a.frequency,
      daysOfWeek: a.daysOfWeek,
      targetCount: a.targetCount || 1,
    })),
  });

  const handleSaveDraft = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateClientSide()) return;

    try {
      setSubmitting(true);
      setErrorMessage(null);

      const payload = buildPayload();

      if (editingProgramId) {
        await updateProgram(editingProgramId, payload);
        showToast('Challenge draft updated successfully!');
      } else {
        await createProgram(payload);
        showToast('Challenge draft saved successfully!');
      }

      closeModal();
      await loadPrograms();
    } catch (err: any) {
      if (err instanceof ManagerApiError && err.fieldErrors) {
        const errorMap: Record<string, string> = {};
        err.fieldErrors.forEach((fe) => {
          errorMap[fe.field] = fe.message;
        });
        setFieldErrors(errorMap);
      }
      setErrorMessage(err.message || 'Failed to save challenge draft.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestSaveAndPublish = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!validateClientSide()) return;

    setConfirmDialog({
      isOpen: true,
      title: 'Publish Challenge to the Web?',
      message:
        'Are you ready to publish this challenge? Once published, participants will immediately be able to view and join it via its public invitation link.',
      confirmLabel: 'Publish Now',
      cancelLabel: 'Cancel',
      confirmVariant: 'primary',
      onConfirm: async () => {
        await executeSaveAndPublish();
      },
    });
  };

  const executeSaveAndPublish = async () => {
    try {
      setSubmitting(true);
      setErrorMessage(null);

      const payload = buildPayload();

      let progId = editingProgramId;
      if (progId) {
        await updateProgram(progId, payload);
      } else {
        const created = await createProgram(payload);
        progId = created.id;
      }

      const deployed = await deployProgram(progId);
      showToast(`Challenge published! Public invite link: ${deployed.inviteUrl}`);
      closeModal();
      await loadPrograms();
    } catch (err: any) {
      if (err instanceof ManagerApiError && err.fieldErrors) {
        const errorMap: Record<string, string> = {};
        err.fieldErrors.forEach((fe) => {
          errorMap[fe.field] = fe.message;
        });
        setFieldErrors(errorMap);
      }
      setErrorMessage(err.message || 'Failed to publish challenge.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestPublishCard = (prog: ChallengeProgram) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Publish Challenge?',
      message: `Are you ready to publish "${prog.title}" to the web? Participants will immediately be able to view and join via the public invitation link.`,
      confirmLabel: 'Publish to Web',
      cancelLabel: 'Cancel',
      confirmVariant: 'primary',
      onConfirm: async () => {
        await handleDeployCard(prog.id);
      },
    });
  };

  const handleRequestDeleteDraft = (prog: ChallengeProgram) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Draft Challenge?',
      message: `Are you sure you want to delete "${prog.title}"? This action cannot be undone and will permanently remove this draft challenge.`,
      confirmLabel: 'Delete Draft',
      cancelLabel: 'Cancel',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          setIsDeletingId(prog.id);
          await deleteProgram(prog.id);
          showToast('Draft challenge deleted.');
          await loadPrograms();
        } catch (err: any) {
          setErrorMessage(err.message || 'Failed to delete draft challenge.');
        } finally {
          setIsDeletingId(null);
        }
      },
    });
  };

  const handleRequestUnpublish = (prog: ChallengeProgram) => {
    const count = prog.enrollmentsCount ?? 0;
    if (count === 0) {
      setConfirmDialog({
        isOpen: true,
        title: 'Unpublish Challenge?',
        message: `You are unpublishing "${prog.title}". 0 users have accepted this challenge, so it is safe to unpublish. This challenge will revert back to a draft for editing.`,
        confirmLabel: 'Unpublish Challenge',
        cancelLabel: 'Cancel',
        confirmVariant: 'primary',
        onConfirm: async () => {
          await executeUnpublish(prog.id);
        },
      });
    } else {
      setConfirmDialog({
        isOpen: true,
        title: 'Unpublish Active Challenge?',
        message: `Warning: You are unpublishing "${prog.title}". ${count} user${count === 1 ? '' : 's'} have already accepted and enrolled in this challenge. Unpublishing will change their challenge status and revert this program back to a draft for editing. Do you still want to unpublish?`,
        confirmLabel: 'Proceed & Unpublish',
        cancelLabel: 'Cancel',
        confirmVariant: 'danger',
        onConfirm: async () => {
          await executeUnpublish(prog.id);
        },
      });
    }
  };

  const executeUnpublish = async (progId: number) => {
    try {
      setUnpublishingId(progId);
      await unpublishProgram(progId);
      showToast('Challenge unpublished and reverted to draft.');
      await loadPrograms();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to unpublish challenge.');
    } finally {
      setUnpublishingId(null);
    }
  };

  const handleDeployCard = async (progId: number) => {
    try {
      setDeployingId(progId);
      const res = await deployProgram(progId);
      showToast(`Challenge published! Public link: ${res.inviteUrl}`);
      await loadPrograms();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to deploy challenge.');
    } finally {
      setDeployingId(null);
    }
  };

  const handleArchiveCard = async (progId: number) => {
    try {
      setArchivingId(progId);
      await archiveProgram(progId);
      showToast('Challenge archived.');
      await loadPrograms();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to archive challenge.');
    } finally {
      setArchivingId(null);
    }
  };

  const handleCopyLink = (inviteUrl: string) => {
    const fullUrl = `${window.location.origin}${inviteUrl}`;
    navigator.clipboard.writeText(fullUrl);
    showToast('Link copied to clipboard!');
  };

  return (
    <div style={{ padding: '1rem 0' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed',
            top: '80px',
            right: '1.5rem',
            backgroundColor: 'var(--walnut)',
            color: '#fff',
            padding: '10px 18px',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(114, 67, 25, 0.25)',
            zIndex: 2000,
            fontWeight: 600,
            fontSize: '0.9375rem',
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Global Error Banner */}
      {errorMessage && (
        <div
          role="alert"
          aria-live="assertive"
          style={{
            backgroundColor: 'var(--color-error-bg)',
            color: 'var(--color-error)',
            border: '1px solid var(--color-error)',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            fontWeight: 600,
          }}
        >
          {errorMessage}
        </div>
      )}

      {/* Header section above the table */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.5rem', color: 'var(--walnut)', fontWeight: 800, margin: '0 0 4px 0' }}>
            Challenge Programs
          </h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
            Overview of your standardized wellness challenge programs, curriculums, and deployment links.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          style={{
            backgroundColor: 'var(--walnut)',
            color: '#fff',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            fontWeight: 700,
            fontSize: '0.9375rem',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(114, 67, 25, 0.15)',
            transition: 'background-color 0.2s',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#5a3514';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--walnut)';
          }}
        >
          + Create Challenge
        </button>
      </div>

      {/* Table-Style Layout Container */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: '12px',
          border: '1px solid var(--papaya-whip)',
          boxShadow: '0 4px 16px rgba(114, 67, 25, 0.05)',
          overflow: 'hidden',
        }}
      >
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            Loading challenge programs...
          </div>
        ) : programs.length === 0 ? (
          <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
            <p style={{ margin: '0 0 0.5rem 0', fontWeight: 700, color: 'var(--walnut)', fontSize: '1.125rem' }}>
              No challenges created yet.
            </p>
            <p style={{ margin: '0 0 1.25rem 0', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>
              Click &quot;+ Create Challenge&quot; above to build and publish your first challenge program.
            </p>
            <button
              type="button"
              onClick={openCreateModal}
              style={{
                backgroundColor: 'var(--walnut)',
                color: '#fff',
                border: 'none',
                padding: '8px 18px',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              + Create Challenge
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '0.875rem',
              }}
            >
              <thead>
                <tr
                  style={{
                    backgroundColor: 'var(--papaya-whip)',
                    borderBottom: '2px solid #ecd8b3',
                    color: 'var(--walnut)',
                    fontSize: '0.75rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Challenge Title</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Category</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Duration</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Activities</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Status</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700 }}>Public Link</th>
                  <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {programs.map((prog, idx) => {
                  const isPublished = prog.status === 'PUBLISHED';
                  const isDraft = prog.status === 'DRAFT';
                  const isArchived = prog.status === 'ARCHIVED';

                  return (
                    <tr
                      key={prog.id}
                      style={{
                        borderBottom: '1px solid var(--papaya-whip)',
                        backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fffcf8',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      {/* Challenge Title */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', maxWidth: '240px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--walnut)', fontSize: '0.9375rem', marginBottom: '2px' }}>
                          {prog.title}
                        </div>
                        {prog.description && (
                          <div
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--color-text-muted)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '220px',
                            }}
                          >
                            {prog.description}
                          </div>
                        )}
                      </td>

                      {/* Category */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            backgroundColor: 'var(--papaya-whip)',
                            color: 'var(--walnut)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            padding: '3px 10px',
                            borderRadius: '12px',
                          }}
                        >
                          {prog.category}
                        </span>
                      </td>

                      {/* Duration */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', whiteSpace: 'nowrap', color: 'var(--color-text-main)' }}>
                        <div>{prog.startDate.split('T')[0]}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          to {prog.endDate.split('T')[0]}
                        </div>
                      </td>

                      {/* Activities */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                        <span style={{ fontWeight: 600, color: 'var(--walnut)' }}>
                          {prog.activitiesCount ?? prog.activities?.length ?? 0} activities
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                          <span
                            style={{
                              display: 'inline-block',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              padding: '3px 10px',
                              borderRadius: '12px',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              backgroundColor: isPublished
                                ? 'var(--golden-sand)'
                                : isDraft
                                ? 'var(--light-coral)'
                                : '#9e9e9e',
                              color: isPublished ? 'var(--walnut)' : '#fff',
                            }}
                          >
                            {prog.status}
                          </span>
                          {isDraft && prog.previouslyPublished && (
                            <span
                              style={{
                                display: 'inline-block',
                                fontSize: '0.6875rem',
                                fontWeight: 600,
                                padding: '2px 8px',
                                borderRadius: '6px',
                                backgroundColor: '#fff3cd',
                                color: '#856404',
                                border: '1px solid #ffeeba',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              Previously Published
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Public Link */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        {isPublished ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <code
                              style={{
                                fontSize: '0.75rem',
                                backgroundColor: 'var(--papaya-whip)',
                                color: 'var(--walnut)',
                                padding: '3px 6px',
                                borderRadius: '4px',
                              }}
                            >
                              /challenges/{prog.id}
                            </code>
                            <button
                              type="button"
                              onClick={() => handleCopyLink(`/challenges/${prog.id}`)}
                              style={{
                                backgroundColor: 'transparent',
                                border: '1px solid var(--walnut)',
                                color: 'var(--walnut)',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '0.6875rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Copy Link
                            </button>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8125rem' }}>—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', alignItems: 'center' }}>
                          {isDraft && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleEditDraft(prog)}
                                style={{
                                  backgroundColor: 'transparent',
                                  border: '1px solid var(--walnut)',
                                  color: 'var(--walnut)',
                                  padding: '5px 12px',
                                  borderRadius: '6px',
                                  fontWeight: 600,
                                  fontSize: '0.75rem',
                                  cursor: 'pointer',
                                }}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                disabled={deployingId === prog.id}
                                onClick={() => handleRequestPublishCard(prog)}
                                style={{
                                  backgroundColor: 'var(--walnut)',
                                  color: '#fff',
                                  border: 'none',
                                  padding: '5px 12px',
                                  borderRadius: '6px',
                                  fontWeight: 600,
                                  fontSize: '0.75rem',
                                  cursor: 'pointer',
                                  opacity: deployingId === prog.id ? 0.7 : 1,
                                }}
                              >
                                {deployingId === prog.id ? 'Publishing...' : 'Publish'}
                              </button>
                              <button
                                type="button"
                                disabled={isDeletingId === prog.id}
                                onClick={() => handleRequestDeleteDraft(prog)}
                                style={{
                                  backgroundColor: 'transparent',
                                  border: '1px solid var(--light-coral)',
                                  color: 'var(--light-coral)',
                                  padding: '5px 10px',
                                  borderRadius: '6px',
                                  fontWeight: 600,
                                  fontSize: '0.75rem',
                                  cursor: 'pointer',
                                  opacity: isDeletingId === prog.id ? 0.7 : 1,
                                }}
                              >
                                {isDeletingId === prog.id ? 'Deleting...' : 'Delete Draft'}
                              </button>
                            </>
                          )}

                          {isPublished && (
                            <>
                              <button
                                type="button"
                                disabled={unpublishingId === prog.id}
                                onClick={() => handleRequestUnpublish(prog)}
                                style={{
                                  backgroundColor: 'transparent',
                                  border: '1px solid var(--light-coral)',
                                  color: 'var(--light-coral)',
                                  padding: '5px 10px',
                                  borderRadius: '6px',
                                  fontWeight: 600,
                                  fontSize: '0.75rem',
                                  cursor: unpublishingId === prog.id ? 'not-allowed' : 'pointer',
                                  opacity: unpublishingId === prog.id ? 0.7 : 1,
                                }}
                              >
                                {unpublishingId === prog.id ? 'Unpublishing...' : 'Unpublish'}
                              </button>
                              <button
                                type="button"
                                disabled={archivingId === prog.id}
                                onClick={() => handleArchiveCard(prog.id)}
                                style={{
                                  backgroundColor: 'transparent',
                                  border: '1px solid #9e9e9e',
                                  color: '#666',
                                  padding: '5px 10px',
                                  borderRadius: '6px',
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  cursor: 'pointer',
                                }}
                              >
                                {archivingId === prog.id ? 'Archiving...' : 'Archive'}
                              </button>
                            </>
                          )}

                          {isArchived && (
                            <span style={{ fontSize: '0.75rem', color: '#9e9e9e', fontStyle: 'italic' }}>
                              Archived
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Dialog for Challenge Creation & Editing */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="challenge-modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(45, 28, 11, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleRequestCancel();
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '14px',
              width: '100%',
              maxWidth: '580px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 12px 36px rgba(114, 67, 25, 0.25)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 id="challenge-modal-title" style={{ fontSize: '1.25rem', color: 'var(--walnut)', fontWeight: 700, margin: 0 }}>
                {editingProgramId ? 'Edit Challenge Draft' : 'Create a New Challenge'}
              </h2>
              <button
                type="button"
                onClick={handleRequestCancel}
                aria-label="Close modal"
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.25rem',
                  color: 'var(--walnut)',
                  cursor: 'pointer',
                  padding: '4px',
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>

            {isPreviouslyPublished && (
              <div
                role="note"
                style={{
                  backgroundColor: '#fff8e1',
                  border: '1px solid #ffe082',
                  color: '#795548',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '0.8125rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  lineHeight: 1.4,
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>ℹ️</span>
                <div>
                  <strong>Previously Published:</strong> This challenge was previously published and is currently unpublished. Changes saved as draft remain unpublished until you choose to re-publish.
                </div>
              </div>
            )}

            <form onSubmit={handleSaveDraft} noValidate>
              {/* Program Title */}
              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="program-title" style={{ display: 'block', fontWeight: 600, color: 'var(--walnut)', fontSize: '0.875rem', marginBottom: '4px' }}>
                  Program Title <span style={{ color: 'var(--color-error)' }}>*</span>
                </label>
                <input
                  id="program-title"
                  name="title"
                  type="text"
                  required
                  aria-required="true"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 30-Day Wellness Challenge"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${fieldErrors.title ? 'var(--color-error)' : 'var(--papaya-whip)'}`,
                    fontSize: '0.9375rem',
                    color: 'var(--color-text-main)',
                    boxSizing: 'border-box',
                  }}
                />
                {fieldErrors.title && (
                  <div role="alert" style={{ color: 'var(--color-error)', fontSize: '0.8125rem', marginTop: '4px' }}>
                    {fieldErrors.title}
                  </div>
                )}
              </div>

              {/* Category Dropdown */}
              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="program-category" style={{ display: 'block', fontWeight: 600, color: 'var(--walnut)', fontSize: '0.875rem', marginBottom: '4px' }}>
                  Category <span style={{ color: 'var(--color-error)' }}>*</span>
                </label>
                <select
                  id="program-category"
                  name="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${fieldErrors.category ? 'var(--color-error)' : 'var(--papaya-whip)'}`,
                    fontSize: '0.9375rem',
                    color: 'var(--color-text-main)',
                    backgroundColor: '#fff',
                    boxSizing: 'border-box',
                  }}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <label htmlFor="program-desc" style={{ fontWeight: 600, color: 'var(--walnut)', fontSize: '0.875rem' }}>
                    Description / Guidelines
                  </label>
                  <span style={{ fontSize: '0.75rem', color: description.length > 500 ? 'var(--color-error)' : 'var(--color-text-muted)' }}>
                    {description.length} / 500
                  </span>
                </div>
                <textarea
                  id="program-desc"
                  name="description"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Program instructions and wellness objectives..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: `1px solid ${fieldErrors.description ? 'var(--color-error)' : 'var(--papaya-whip)'}`,
                    fontSize: '0.9375rem',
                    color: 'var(--color-text-main)',
                    boxSizing: 'border-box',
                  }}
                />
                {fieldErrors.description && (
                  <div role="alert" style={{ color: 'var(--color-error)', fontSize: '0.8125rem', marginTop: '4px' }}>
                    {fieldErrors.description}
                  </div>
                )}
              </div>

              {/* Dates Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <label htmlFor="program-start" style={{ display: 'block', fontWeight: 600, color: 'var(--walnut)', fontSize: '0.875rem', marginBottom: '4px' }}>
                    Start Date <span style={{ color: 'var(--color-error)' }}>*</span>
                  </label>
                  <input
                    id="program-start"
                    name="startDate"
                    type="date"
                    required
                    aria-required="true"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: `1px solid ${fieldErrors.startDate ? 'var(--color-error)' : 'var(--papaya-whip)'}`,
                      fontSize: '0.875rem',
                      boxSizing: 'border-box',
                    }}
                  />
                  {fieldErrors.startDate && (
                    <div role="alert" style={{ color: 'var(--color-error)', fontSize: '0.75rem', marginTop: '4px' }}>
                      {fieldErrors.startDate}
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="program-end" style={{ display: 'block', fontWeight: 600, color: 'var(--walnut)', fontSize: '0.875rem', marginBottom: '4px' }}>
                    End Date <span style={{ color: 'var(--color-error)' }}>*</span>
                  </label>
                  <input
                    id="program-end"
                    name="endDate"
                    type="date"
                    required
                    aria-required="true"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      border: `1px solid ${fieldErrors.endDate ? 'var(--color-error)' : 'var(--papaya-whip)'}`,
                      fontSize: '0.875rem',
                      boxSizing: 'border-box',
                    }}
                  />
                  {fieldErrors.endDate && (
                    <div role="alert" style={{ color: 'var(--color-error)', fontSize: '0.75rem', marginTop: '4px' }}>
                      {fieldErrors.endDate}
                    </div>
                  )}
                </div>
              </div>

              {/* Standardized Activities Section */}
              <div style={{ marginBottom: '1.5rem', borderTop: '1px solid var(--papaya-whip)', paddingTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontWeight: 700, color: 'var(--walnut)', fontSize: '0.9375rem' }}>
                    Curriculum Activities <span style={{ color: 'var(--color-error)' }}>*</span> (Min 1)
                  </span>
                  <button
                    type="button"
                    onClick={handleAddActivity}
                    style={{
                      backgroundColor: 'transparent',
                      border: '1px solid var(--walnut)',
                      color: 'var(--walnut)',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontWeight: 600,
                      fontSize: '0.8125rem',
                      cursor: 'pointer',
                    }}
                  >
                    + Add Activity
                  </button>
                </div>

                {fieldErrors.activities && (
                  <div role="alert" style={{ color: 'var(--color-error)', fontSize: '0.8125rem', marginBottom: '8px' }}>
                    {fieldErrors.activities}
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {activities.map((act, index) => (
                    <div
                      key={index}
                      style={{
                        border: '1px solid var(--papaya-whip)',
                        borderRadius: '8px',
                        padding: '0.75rem',
                        backgroundColor: '#faf8f5',
                      }}
                    >
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--walnut)', fontSize: '0.8125rem', width: '20px' }}>
                          {index + 1}.
                        </span>
                        <input
                          type="text"
                          required
                          aria-label={`Activity ${index + 1} Title`}
                          placeholder="Activity title (e.g. Daily Hydration 2L)"
                          value={act.title}
                          onChange={(e) => handleActivityChange(index, 'title', e.target.value)}
                          style={{
                            flex: 1,
                            padding: '6px 10px',
                            borderRadius: '4px',
                            border: `1px solid ${fieldErrors[`activities[${index}].title`] ? 'var(--color-error)' : '#ddd'}`,
                            fontSize: '0.875rem',
                          }}
                        />
                        {activities.length > 1 && (
                          <button
                            type="button"
                            aria-label={`Remove activity ${index + 1}`}
                            title={`Remove activity ${index + 1}`}
                            onClick={() => handleRemoveActivity(index)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--light-coral)',
                              padding: '4px 6px',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'color 0.15s ease, background-color 0.15s ease',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = '#b3261e';
                              e.currentTarget.style.backgroundColor = 'rgba(216, 129, 128, 0.15)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = 'var(--light-coral)';
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                              style={{ display: 'block' }}
                            >
                              <polyline points="3 6 5 6 21 6" />
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              <line x1="10" y1="11" x2="10" y2="17" />
                              <line x1="14" y1="11" x2="14" y2="17" />
                            </svg>
                          </button>
                        )}
                      </div>
                      {fieldErrors[`activities[${index}].title`] && (
                        <div role="alert" style={{ color: 'var(--color-error)', fontSize: '0.75rem', marginBottom: '4px' }}>
                          {fieldErrors[`activities[${index}].title`]}
                        </div>
                      )}

                      {/* Day of Week Selector */}
                      <div style={{ marginTop: '8px' }}>
                        <DayOfWeekSelector
                          id={`activity-${index}-days`}
                          label={`Activity ${index + 1} Schedule`}
                          selectedDays={act.daysOfWeek || [1, 2, 3, 4, 5, 6, 7]}
                          onChange={(days) => handleActivityDaysChange(index, days)}
                          compact
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons: 3 Options (Cancel, Save as Draft, Save and Publish) */}
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={handleRequestCancel}
                  disabled={submitting}
                  style={{
                    flex: '1 1 auto',
                    backgroundColor: '#f5f5f5',
                    border: '1px solid #d5d0c8',
                    color: 'var(--walnut)',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    flex: '1.2 1 auto',
                    backgroundColor: '#cad182ff',
                    border: '1px solid #b8bf6f',
                    color: 'var(--walnut)',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.7 : 1,
                    transition: 'all 0.15s ease',
                    boxShadow: '0 2px 4px rgba(202, 209, 130, 0.3)',
                  }}
                >
                  {submitting ? 'Saving...' : 'Save as Draft'}
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleRequestSaveAndPublish}
                  style={{
                    flex: '1.3 1 auto',
                    backgroundColor: 'var(--walnut)',
                    color: '#fff',
                    border: 'none',
                    padding: '10px 14px',
                    borderRadius: '6px',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  Save and Publish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog Modal */}
      {confirmDialog && confirmDialog.isOpen && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          aria-describedby="confirm-dialog-desc"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200,
            padding: '1rem',
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '12px',
              padding: '1.75rem',
              maxWidth: '440px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              boxSizing: 'border-box',
            }}
          >
            <h3
              id="confirm-dialog-title"
              style={{
                fontSize: '1.2rem',
                fontWeight: 700,
                color: 'var(--walnut)',
                marginTop: 0,
                marginBottom: '0.75rem',
              }}
            >
              {confirmDialog.title}
            </h3>
            <p
              id="confirm-dialog-desc"
              style={{
                fontSize: '0.9375rem',
                color: 'var(--color-text-main)',
                lineHeight: 1.5,
                marginTop: 0,
                marginBottom: '1.5rem',
              }}
            >
              {confirmDialog.message}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={() => {
                  if (confirmDialog.onCancel) confirmDialog.onCancel();
                  setConfirmDialog(null);
                }}
                style={{
                  backgroundColor: '#f5f5f5',
                  color: 'var(--color-text-main)',
                  border: '1px solid #d5d0c8',
                  borderRadius: '6px',
                  padding: '8px 16px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {confirmDialog.cancelLabel || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={async () => {
                  const action = confirmDialog.onConfirm;
                  setConfirmDialog(null);
                  await action();
                }}
                style={{
                  backgroundColor:
                    confirmDialog.confirmVariant === 'danger' ? 'var(--light-coral)' : 'var(--walnut)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '8px 18px',
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {confirmDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
