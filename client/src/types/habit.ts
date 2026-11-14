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

export interface UpdateHabitPayload {
  title?: string;
  description?: string | null;
  colorHex?: string;
  frequency?: FrequencyType;
  daysOfWeek?: number[];
  startDate?: string;
  endDate?: string | null;
  targetCount?: number;
}

export interface CalendarHabit {
  habitId: number;
  title: string;
  description?: string | null;
  colorHex: string;
  frequency?: FrequencyType;
  daysOfWeek?: number[];
  startDate?: string;
  endDate?: string | null;
  targetCount: number;
  goalAchievedCount: number;
  days: Record<string, boolean>;
}

export interface CalendarMatrixResponse {
  month: number;
  year: number;
  daysInMonth: number;
  dayInitials: string[];
  habits: CalendarHabit[];
}

export interface HabitGoalSummary {
  habitId: number;
  title: string;
  target: number;
  achieved: number;
}

export interface GoalsSummaryResponse {
  activeHabitsCount: number;
  totalGoalsAchievedThisMonth: number;
  habitsSummary: HabitGoalSummary[];
}

export interface DailyNote {
  id: number;
  habitId: number | null;
  habitTitle: string | null;
  colorHex?: string | null;
  noteDate: string;
  timestamp: string;
  content: string;
}

export interface CreateNotePayload {
  noteDate: string;
  content: string;
  habitId?: number | null;
}

export interface UpdateNotePayload {
  noteDate?: string;
  content?: string;
  habitId?: number | null;
}

