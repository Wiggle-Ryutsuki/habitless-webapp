export const ALLOWED_HABIT_COLORS = [
  '#448aff', // Blue Energy
  '#1565c0', // Ocean Deep
  '#009688', // Verdigris
  '#8bc34a', // Yellow Green
  '#ffc107', // Amber Gold
  '#ff9800', // Amber Glow
  '#f44336', // Cinnabar
  '#ad1457', // Cherry Rose
] as const;

export type HabitColor = (typeof ALLOWED_HABIT_COLORS)[number];

const ALLOWED_SET_6 = new Set(ALLOWED_HABIT_COLORS.map((c) => c.toLowerCase()));
const ALLOWED_SET_8 = new Set(ALLOWED_HABIT_COLORS.map((c) => `${c.toLowerCase()}ff`));

export function isValidHabitColor(color: unknown): color is string {
  if (typeof color !== 'string') return false;
  const trimmed = color.trim().toLowerCase();
  return ALLOWED_SET_6.has(trimmed) || ALLOWED_SET_8.has(trimmed);
}

export function normalizeHabitColor(color: string): string {
  const trimmed = color.trim().toLowerCase();
  if (trimmed.length === 9 && trimmed.endsWith('ff')) {
    return trimmed.slice(0, 7);
  }
  return trimmed;
}

