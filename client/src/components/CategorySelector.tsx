import React from 'react';

export const HABIT_CATEGORY_PRESETS = [
  'Health & Fitness',
  'Sleep & Recovery',
  'Mindfulness',
  'Productivity',
  'Learning',
  'Finance',
  'Social',
  'Home',
  'Hobbies',
] as const;

export const CUSTOM_CATEGORY_VALUE = '__CUSTOM__';

export interface CategorySelectionState {
  selectedOption: string;
  customValue: string;
}

/**
 * Derives dropdown + custom text state from an existing category string.
 */
export function getInitialCategoryState(
  category: string | null | undefined,
  allowUncategorized: boolean
): CategorySelectionState {
  const trimmed = typeof category === 'string' ? category.trim() : '';
  if (!trimmed) {
    return {
      selectedOption: allowUncategorized ? '' : HABIT_CATEGORY_PRESETS[0],
      customValue: '',
    };
  }
  if ((HABIT_CATEGORY_PRESETS as readonly string[]).includes(trimmed)) {
    return {
      selectedOption: trimmed,
      customValue: '',
    };
  }
  return {
    selectedOption: CUSTOM_CATEGORY_VALUE,
    customValue: trimmed,
  };
}

/**
 * Resolves the normalized category payload value (`null` when uncategorized).
 */
export function resolveCategoryValue(
  selectedOption: string,
  customValue: string
): string | null {
  if (!selectedOption) {
    return null;
  }
  if (selectedOption === CUSTOM_CATEGORY_VALUE) {
    const trimmed = customValue.trim();
    return trimmed || null;
  }
  return selectedOption;
}

/**
 * Validates preset or custom category input according to Sprint 2 rules.
 */
export function validateCategorySelection(
  selectedOption: string,
  customValue: string,
  required: boolean
): string | null {
  if (selectedOption === CUSTOM_CATEGORY_VALUE) {
    const trimmed = customValue.trim();
    if (!trimmed) {
      return required
        ? 'Custom category is required.'
        : 'Please enter a custom category or select Uncategorized.';
    }
    if (trimmed.length > 50) {
      return 'Category cannot exceed 50 characters.';
    }
    return null;
  }

  if (required && !selectedOption.trim()) {
    return 'Category is required.';
  }

  return null;
}

export interface CategorySelectorProps {
  id: string;
  name?: string;
  selectedOption: string;
  customValue: string;
  onSelectChange: (value: string) => void;
  onCustomChange: (value: string) => void;
  allowUncategorized: boolean;
  required?: boolean;
  error?: string;
}

/**
 * Shared Category dropdown (9 Sprint 2 presets + Custom... text input) for Habits and Challenges.
 */
export const CategorySelector: React.FC<CategorySelectorProps> = ({
  id,
  name,
  selectedOption,
  customValue,
  onSelectChange,
  onCustomChange,
  allowUncategorized,
  required = false,
  error,
}) => {
  const isCustom = selectedOption === CUSTOM_CATEGORY_VALUE;

  return (
    <div>
      <label
        htmlFor={id}
        style={{
          display: 'block',
          fontWeight: 600,
          fontSize: '0.875rem',
          marginBottom: '0.375rem',
          color: 'var(--walnut)',
        }}
      >
        Category{!required ? ' (Optional)' : ''}{' '}
        {required && <span style={{ color: 'var(--color-error)' }}>*</span>}
      </label>

      <select
        id={id}
        name={name}
        aria-label="Category"
        value={selectedOption}
        onChange={(e) => onSelectChange(e.target.value)}
        style={{
          width: '100%',
          height: '42px',
          borderRadius: '6px',
          border: `1px solid ${error && !isCustom ? 'var(--color-error)' : 'var(--papaya-whip)'}`,
          padding: '0 0.75rem',
          backgroundColor: '#ffffff',
          color: 'var(--color-text-main)',
          fontSize: '0.9375rem',
          boxSizing: 'border-box',
        }}
      >
        {allowUncategorized && <option value="">Uncategorized (Optional)</option>}
        {HABIT_CATEGORY_PRESETS.map((preset) => (
          <option key={preset} value={preset}>
            {preset}
          </option>
        ))}
        <option value={CUSTOM_CATEGORY_VALUE}>Custom...</option>
      </select>

      {isCustom && (
        <div style={{ marginTop: '0.625rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
            <label
              htmlFor={`${id}-custom`}
              style={{
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: 'var(--color-text-main)',
              }}
            >
              Custom Category
            </label>
            <span
              style={{
                fontSize: '0.75rem',
                color: customValue.length > 50 ? 'var(--color-error)' : 'var(--color-text-muted)',
              }}
            >
              {customValue.length} / 50
            </span>
          </div>
          <input
            id={`${id}-custom`}
            type="text"
            aria-label="Custom category"
            value={customValue}
            onChange={(e) => onCustomChange(e.target.value)}
            maxLength={50}
            placeholder="Enter custom category (max 50 chars)"
            style={{
              width: '100%',
              height: '42px',
              borderRadius: '6px',
              border: `1px solid ${error ? 'var(--color-error)' : 'var(--papaya-whip)'}`,
              padding: '0 0.75rem',
              backgroundColor: '#ffffff',
              color: 'var(--color-text-main)',
              fontSize: '0.9375rem',
              boxSizing: 'border-box',
            }}
          />
        </div>
      )}

      {error && (
        <p
          role="alert"
          aria-live="polite"
          style={{
            color: 'var(--color-error)',
            fontSize: '0.8125rem',
            marginTop: '0.25rem',
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
};
