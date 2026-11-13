export type FrequencyType =
  | 'DAILY'
  | 'WEEKDAYS'
  | 'THREE_TIMES_WEEKLY'
  | 'WEEKLY'
  | 'MONTHLY'
  | 'CUSTOM_DAYS';

export interface Habit {
  id: number;
  userId: number;
  title: string;
  description: string | null;
  colorHex: string;
  frequency: FrequencyType;
  daysOfWeek: number[];
  startDate: string;
  endDate: string | null;
  targetCount: number;
  isActive: boolean;
  programId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistItem {
  habitId: number;
  title: string;
  description: string | null;
  colorHex: string;
  frequency: FrequencyType;
  isCompleted: boolean;
  logId: number | null;
}

export interface TodayChecklistResponse {
  date: string;
  totalScheduled: number;
  completedCount: number;
  items: ChecklistItem[];
}

export interface CreateHabitPayload {
  title: string;
  description?: string;
  colorHex: string;
  frequency: FrequencyType;
  daysOfWeek?: number[];
  startDate?: string;
  endDate?: string | null;
  targetCount?: number;
}

