import {
  Habit,
  TodayChecklistResponse,
  CreateHabitPayload,
  UpdateHabitPayload,
  CalendarMatrixResponse,
  GoalsSummaryResponse,
  DailyNote,
  CreateNotePayload,
} from '../types/habit.js';

const API_BASE = '/api';

export class HabitApiError extends Error {
  code: string;
  fieldErrors?: Record<string, string>;

  constructor(message: string, code = 'API_ERROR', fieldErrors?: Record<string, string>) {
    super(message);
    this.name = 'HabitApiError';
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errBody: { error?: { code?: string; message?: string; fieldErrors?: Record<string, string> } } = {};
    try {
      errBody = await res.json();
    } catch {
      // response might not be JSON
    }
    const message = errBody.error?.message || `Request failed with status ${res.status}`;
    const code = errBody.error?.code || 'API_ERROR';
    throw new HabitApiError(message, code, errBody.error?.fieldErrors);
  }
  return res.json() as Promise<T>;
}

export async function fetchTodayChecklist(date?: string): Promise<TodayChecklistResponse> {
  const query = date ? `?date=${encodeURIComponent(date)}` : '';
  const res = await fetch(`${API_BASE}/tracking/today${query}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });
  return handleResponse<TodayChecklistResponse>(res);
}

export async function toggleHabitCompletion(
  habitId: number,
  date: string,
  completed: boolean
): Promise<{ habitId: number; date: string; completed: boolean }> {
  const res = await fetch(`${API_BASE}/tracking/log`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ habitId, date, completed }),
  });
  return handleResponse<{ habitId: number; date: string; completed: boolean }>(res);
}

export async function createHabit(payload: CreateHabitPayload): Promise<Habit> {
  const res = await fetch(`${API_BASE}/habits`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  return handleResponse<Habit>(res);
}

export async function fetchHabits(status: 'active' | 'archived' = 'active'): Promise<Habit[]> {
  const res = await fetch(`${API_BASE}/habits?status=${status}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });
  return handleResponse<Habit[]>(res);
}

export async function updateHabit(id: number, payload: UpdateHabitPayload): Promise<Habit> {
  const res = await fetch(`${API_BASE}/habits/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  return handleResponse<Habit>(res);
}

export async function archiveHabit(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/habits/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    let errBody: { error?: { code?: string; message?: string } } = {};
    try {
      errBody = await res.json();
    } catch {
      // response might not be json
    }
    const message = errBody.error?.message || `Failed to archive habit (Status ${res.status})`;
    const code = errBody.error?.code || 'ARCHIVE_ERROR';
    throw new HabitApiError(message, code);
  }
}

export async function fetchCalendarMatrix(month: number, year: number): Promise<CalendarMatrixResponse> {
  const res = await fetch(`${API_BASE}/tracking/calendar?month=${month}&year=${year}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });
  return handleResponse<CalendarMatrixResponse>(res);
}

export async function fetchGoalsSummary(month?: number, year?: number): Promise<GoalsSummaryResponse> {
  const params = new URLSearchParams();
  if (month) params.append('month', String(month));
  if (year) params.append('year', String(year));
  const query = params.toString() ? `?${params.toString()}` : '';

  const res = await fetch(`${API_BASE}/tracking/goals${query}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });
  return handleResponse<GoalsSummaryResponse>(res);
}

export async function fetchNotes(month?: number, year?: number, habitId?: number): Promise<DailyNote[]> {
  const params = new URLSearchParams();
  if (month) params.append('month', String(month));
  if (year) params.append('year', String(year));
  if (habitId) params.append('habitId', String(habitId));
  const query = params.toString() ? `?${params.toString()}` : '';

  const res = await fetch(`${API_BASE}/tracking/notes${query}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });
  return handleResponse<DailyNote[]>(res);
}

export async function createNote(payload: CreateNotePayload): Promise<DailyNote> {
  const res = await fetch(`${API_BASE}/tracking/notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  return handleResponse<DailyNote>(res);
}

