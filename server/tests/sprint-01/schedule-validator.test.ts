import { describe, it, expect } from 'vitest';
import { isValidDateRange } from '../../src/utils/schedule-validator.js';

describe('Date Range Invariant Validator (UT-02)', () => {
  it('accepts null, undefined, or empty string endDate (ongoing habits)', () => {
    expect(isValidDateRange('2026-11-01', null)).toBe(true);
    expect(isValidDateRange('2026-11-01', undefined)).toBe(true);
    expect(isValidDateRange('2026-11-01', '')).toBe(true);
  });

  it('accepts endDate equal to startDate (single-day habits)', () => {
    expect(isValidDateRange('2026-11-01', '2026-11-01')).toBe(true);
    expect(isValidDateRange(new Date('2026-11-01T00:00:00Z'), new Date('2026-11-01T00:00:00Z'))).toBe(true);
  });

  it('accepts endDate greater than startDate', () => {
    expect(isValidDateRange('2026-11-01', '2026-11-30')).toBe(true);
    expect(isValidDateRange(new Date('2026-11-01'), new Date('2026-12-01'))).toBe(true);
  });

  it('rejects endDate strictly less than startDate', () => {
    expect(isValidDateRange('2026-11-30', '2026-11-01')).toBe(false);
    expect(isValidDateRange(new Date('2026-11-05'), new Date('2026-11-04'))).toBe(false);
  });

  it('rejects invalid date strings', () => {
    expect(isValidDateRange('invalid-date', '2026-11-30')).toBe(false);
    expect(isValidDateRange('2026-11-01', 'invalid-end-date')).toBe(false);
  });
});

