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
  category?: string | null;
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
  category?: string | null;
  colorHex: string;
  frequency: FrequencyType;
  isCompleted: boolean;
  logId: number | null;
  programId?: number | null;
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
  category?: string | null;
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
  category?: string | null;
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
  category?: string | null;
  colorHex: string;
  frequency?: FrequencyType;
  daysOfWeek?: number[];
  startDate?: string;
  endDate?: string | null;
  targetCount: number;
  goalAchievedCount: number;
  programId?: number | null;
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

export interface DashboardWeekDay {
  date: string;
  dayLabel: string;
  dayNumber: number;
  isToday: boolean;
}

export interface DashboardFocusItem {
  habitId: number;
  title: string;
  category: string | null;
  colorHex: string;
  frequency: FrequencyType;
  isCompleted: boolean;
}

export interface DashboardWeeklyProgressItem {
  habitId: number;
  title: string;
  category: string | null;
  colorHex: string;
  frequency: FrequencyType;
  completedDaysThisWeek: number;
  scheduledDaysThisWeek: number;
  percentage: number;
}

export interface DashboardProgramCompletion {
  activeProgramsCount: number;
  totalCompletedLogs: number;
  totalScheduledDaysToDate: number;
  percentage: number;
}

export interface ParticipantDashboardResponse {
  date: string;
  weekStart: string;
  weekEnd: string;
  weekDays: DashboardWeekDay[];
  todayFocus: {
    totalScheduled: number;
    completedCount: number;
    items: DashboardFocusItem[];
  };
  weeklyProgress: DashboardWeeklyProgressItem[];
  programCompletion: DashboardProgramCompletion;
}

export interface HabitHeatmapCell {
  key: string;
  label: string;
  scheduled: boolean;
  completedCount: number;
  scheduledCount: number;
  opacity: number;
  weekday?: number;
  weekIndex?: number;
  month?: number;
}

export interface HabitHeatmapData {
  mode: 'month' | 'year';
  month: number | null;
  year: number;
  cells: HabitHeatmapCell[];
}

export interface HabitStreakSummary {
  currentStreak: number;
  highestStreak: number;
}

export interface HabitStatsResponse {
  habit: {
    id: number;
    title: string;
    description: string | null;
    category: string | null;
    colorHex: string;
    frequency: FrequencyType;
    daysOfWeek: number[];
    startDate: string;
    endDate: string | null;
    targetCount: number;
    programId: number | null;
  };
  streaks: HabitStreakSummary;
  heatmap: HabitHeatmapData;
}

