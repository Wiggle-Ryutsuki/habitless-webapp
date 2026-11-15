import { describe, it, expect } from 'vitest';
import { calculateMonthlyGoals } from '../../src/utils/goals';

describe('Monthly Goals Tracker Calculation (UT-04)', () => {
  it('returns correct count of completed logs within the target month', () => {
    const logs = [
      { logDate: '2021-03-01T00:00:00.000Z', completed: true },
      { logDate: '2021-03-02T00:00:00.000Z', completed: true },
      { logDate: '2021-03-15T00:00:00.000Z', completed: true },
    ];
    const result = calculateMonthlyGoals(logs, 20, 3, 2021);
    expect(result.achieved).toBe(3);
    expect(result.target).toBe(20);
  });

  it('ignores logs marked completed: false', () => {
    const logs = [
      { logDate: '2021-03-01T00:00:00.000Z', completed: true },
      { logDate: '2021-03-02T00:00:00.000Z', completed: false },
      { logDate: '2021-03-03T00:00:00.000Z', completed: true },
    ];
    const result = calculateMonthlyGoals(logs, 15, 3, 2021);
    expect(result.achieved).toBe(2);
    expect(result.target).toBe(15);
  });

  it('ignores logs belonging to other months or years', () => {
    const logs = [
      { logDate: '2021-02-28T00:00:00.000Z', completed: true },
      { logDate: '2021-03-01T00:00:00.000Z', completed: true },
      { logDate: '2021-04-01T00:00:00.000Z', completed: true },
      { logDate: '2020-03-01T00:00:00.000Z', completed: true },
    ];
    const result = calculateMonthlyGoals(logs, 20, 3, 2021);
    expect(result.achieved).toBe(1);
    expect(result.target).toBe(20);
  });

  it('returns achieved: 0 when no logs exist for the habit', () => {
    const result = calculateMonthlyGoals([], 25, 3, 2021);
    expect(result.achieved).toBe(0);
    expect(result.target).toBe(25);
  });

  it('correctly handles and clamps target counts ranging from 1 to 31', () => {
    expect(calculateMonthlyGoals([], 1, 3, 2021).target).toBe(1);
    expect(calculateMonthlyGoals([], 31, 3, 2021).target).toBe(31);
    expect(calculateMonthlyGoals([], 0, 3, 2021).target).toBe(1); // Clamped min 1
    expect(calculateMonthlyGoals([], 50, 3, 2021).target).toBe(31); // Clamped max 31
  });
});

