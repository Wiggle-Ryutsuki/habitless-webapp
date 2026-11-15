import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ColorPicker, HABIT_COLOR_PALETTE } from '../../src/components/ColorPicker.js';

describe('Color Swatch Picker Component (UI-02)', () => {
  it('renders exactly 8 circular color swatch buttons', () => {
    const handleChange = vi.fn();
    render(<ColorPicker value="#ff9800" onChange={handleChange} />);

    const radioGroup = screen.getByRole('radiogroup', { name: /habit color selection/i });
    expect(radioGroup).toBeInTheDocument();

    const swatches = screen.getAllByRole('radio');
    expect(swatches.length).toBe(8);

    // Verify all 8 palette names are present
    for (const option of HABIT_COLOR_PALETTE) {
      expect(screen.getByRole('radio', { name: option.name })).toBeInTheDocument();
    }
  });

  it('highlights the selected color and sets aria-checked="true"', () => {
    const handleChange = vi.fn();
    render(<ColorPicker value="#009688" onChange={handleChange} />);

    const selectedSwatch = screen.getByRole('radio', { name: 'Verdigris' });
    expect(selectedSwatch).toHaveAttribute('aria-checked', 'true');
    expect(selectedSwatch).toHaveTextContent('✓');

    const unselectedSwatch = screen.getByRole('radio', { name: 'Blue Energy' });
    expect(unselectedSwatch).toHaveAttribute('aria-checked', 'false');
    expect(unselectedSwatch).not.toHaveTextContent('✓');
  });

  it('invokes onChange with hex code when a swatch button is clicked', () => {
    const handleChange = vi.fn();
    render(<ColorPicker value="#ff9800" onChange={handleChange} />);

    const blueEnergySwatch = screen.getByRole('radio', { name: 'Blue Energy' });
    fireEvent.click(blueEnergySwatch);

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith('#448aff');
  });

  it('supports keyboard navigation via ArrowRight and ArrowLeft', () => {
    const handleChange = vi.fn();
    render(<ColorPicker value="#448aff" onChange={handleChange} id="test-picker" />);

    const firstSwatch = screen.getByRole('radio', { name: 'Blue Energy' });
    firstSwatch.focus();

    // ArrowRight should select next color (Ocean Deep #1565c0)
    fireEvent.keyDown(firstSwatch, { key: 'ArrowRight' });
    expect(handleChange).toHaveBeenCalledWith('#1565c0');

    // ArrowLeft should cycle to previous color (Cherry Rose #ad1457)
    fireEvent.keyDown(firstSwatch, { key: 'ArrowLeft' });
    expect(handleChange).toHaveBeenCalledWith('#ad1457');
  });
});

