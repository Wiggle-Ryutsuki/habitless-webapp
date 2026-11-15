import { describe, it, expect } from 'vitest';
import {
  ALLOWED_HABIT_COLORS,
  isValidHabitColor,
  normalizeHabitColor,
} from '../../src/utils/palette-validator.js';

describe('Fixed Habit Palette Color Validator (UT-01)', () => {
  it('accepts all 8 official 6-character habit palette colors in lowercase', () => {
    for (const color of ALLOWED_HABIT_COLORS) {
      expect(isValidHabitColor(color)).toBe(true);
      expect(normalizeHabitColor(color)).toBe(color);
    }
  });

  it('accepts all 8 official 6-character habit palette colors in uppercase', () => {
    for (const color of ALLOWED_HABIT_COLORS) {
      const upper = color.toUpperCase();
      expect(isValidHabitColor(upper)).toBe(true);
      expect(normalizeHabitColor(upper)).toBe(color);
    }
  });

  it('accepts 8-character hex equivalents (#RRGGBBff) and normalizes to 6-char', () => {
    for (const color of ALLOWED_HABIT_COLORS) {
      const eightChar = `${color}ff`;
      expect(isValidHabitColor(eightChar)).toBe(true);
      expect(normalizeHabitColor(eightChar)).toBe(color);
    }
  });

  it('rejects arbitrary hex colors outside the approved palette', () => {
    expect(isValidHabitColor('#9C27B0')).toBe(false);
    expect(isValidHabitColor('#000000')).toBe(false);
    expect(isValidHabitColor('#ffffff')).toBe(false);
    expect(isValidHabitColor('#724319')).toBe(false); // Walnut (theme, not habit)
    expect(isValidHabitColor('#feeac7')).toBe(false); // Papaya Whip (theme, not habit)
  });

  it('rejects malformed strings, names, and empty inputs', () => {
    expect(isValidHabitColor('blue')).toBe(false);
    expect(isValidHabitColor('#123')).toBe(false);
    expect(isValidHabitColor('')).toBe(false);
    expect(isValidHabitColor(null)).toBe(false);
    expect(isValidHabitColor(undefined)).toBe(false);
    expect(isValidHabitColor(123)).toBe(false);
  });
});

