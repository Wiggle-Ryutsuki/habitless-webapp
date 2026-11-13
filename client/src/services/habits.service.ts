import { Habit, TodayChecklistResponse, CreateHabitPayload } from '../types/habit.js';

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

