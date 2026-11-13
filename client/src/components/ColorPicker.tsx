import React from 'react';

export interface HabitColorOption {
  name: string;
  hex: string;
}

export const HABIT_COLOR_PALETTE: HabitColorOption[] = [
  { name: 'Blue Energy', hex: '#448aff' },
  { name: 'Ocean Deep', hex: '#1565c0' },
  { name: 'Verdigris', hex: '#009688' },
  { name: 'Yellow Green', hex: '#8bc34a' },
  { name: 'Amber Gold', hex: '#ffc107' },
  { name: 'Amber Glow', hex: '#ff9800' },
  { name: 'Cinnabar', hex: '#f44336' },
  { name: 'Cherry Rose', hex: '#ad1457' },
];

export interface ColorPickerProps {
  value: string;
  onChange: (hex: string) => void;
  id?: string;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ value, onChange, id }) => {
  const normalizedValue = value.toLowerCase();

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    let nextIndex = index;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIndex = (index + 1) % HABIT_COLOR_PALETTE.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIndex = (index - 1 + HABIT_COLOR_PALETTE.length) % HABIT_COLOR_PALETTE.length;
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onChange(HABIT_COLOR_PALETTE[index].hex);
      return;
    } else {
      return;
    }

    const nextColor = HABIT_COLOR_PALETTE[nextIndex].hex;
    onChange(nextColor);
    // Focus the target element
    const el = document.getElementById(`${id || 'color-picker'}-opt-${nextIndex}`);
    if (el) el.focus();
  };

  return (
    <div
      id={id}
      role="radiogroup"
      aria-label="Habit color selection"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.75rem',
        alignItems: 'center',
        padding: '0.25rem 0',
      }}
    >
      {HABIT_COLOR_PALETTE.map((option, index) => {
        const isSelected = normalizedValue === option.hex.toLowerCase();
        return (
          <button
            key={option.hex}
            id={`${id || 'color-picker'}-opt-${index}`}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={option.name}
            tabIndex={isSelected || (!value && index === 0) ? 0 : -1}
            onClick={() => onChange(option.hex)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            style={{
              width: '44px',
              height: '44px',
              minWidth: '44px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              borderRadius: '50%',
            }}
          >
            <span
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: option.hex,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 700,
                boxShadow: isSelected
                  ? `0 0 0 3px #ffffff, 0 0 0 5px var(--walnut)`
                  : '0 2px 4px rgba(0,0,0,0.15)',
                transition: 'box-shadow 0.15s ease, transform 0.15s ease',
                transform: isSelected ? 'scale(1.05)' : 'scale(1)',
              }}
            >
              {isSelected ? '✓' : ''}
            </span>
          </button>
        );
      })}
    </div>
  );
};

