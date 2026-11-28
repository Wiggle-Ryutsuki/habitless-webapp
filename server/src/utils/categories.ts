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

export type HabitCategoryPreset = (typeof HABIT_CATEGORY_PRESETS)[number];

export function isPresetCategory(category: string): boolean {
  return (HABIT_CATEGORY_PRESETS as readonly string[]).includes(category.trim());
}
