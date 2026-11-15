import {
  ChallengeProgram,
  CreateProgramPayload,
  UpdateProgramPayload,
} from '../types/challenge.types.js';

const API_BASE = '/api';

export class ManagerApiError extends Error {
  code: string;
  fieldErrors?: Array<{ field: string; message: string }>;

  constructor(message: string, code = 'API_ERROR', fieldErrors?: Array<{ field: string; message: string }>) {
    super(message);
    this.name = 'ManagerApiError';
    this.code = code;
    this.fieldErrors = fieldErrors;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errBody: { error?: { code?: string; message?: string; fieldErrors?: Array<{ field: string; message: string }> } } = {};
    try {
      errBody = await res.json();
    } catch {
      // response might not be JSON
    }
    const message = errBody.error?.message || `Request failed with status ${res.status}`;
    const code = errBody.error?.code || 'API_ERROR';
    throw new ManagerApiError(message, code, errBody.error?.fieldErrors);
  }
  return res.json() as Promise<T>;
}

export async function fetchManagerPrograms(): Promise<ChallengeProgram[]> {
  const res = await fetch(`${API_BASE}/manager/programs`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  return handleResponse<ChallengeProgram[]>(res);
}

export async function fetchManagerProgram(id: number): Promise<ChallengeProgram> {
  const res = await fetch(`${API_BASE}/manager/programs/${id}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  return handleResponse<ChallengeProgram>(res);
}

export async function createProgram(payload: CreateProgramPayload): Promise<ChallengeProgram> {
  const res = await fetch(`${API_BASE}/manager/programs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  return handleResponse<ChallengeProgram>(res);
}

export async function updateProgram(id: number, payload: UpdateProgramPayload): Promise<ChallengeProgram> {
  const res = await fetch(`${API_BASE}/manager/programs/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  return handleResponse<ChallengeProgram>(res);
}

export async function deployProgram(id: number): Promise<{ id: number; title: string; status: string; deployedAt: string; inviteUrl: string }> {
  const res = await fetch(`${API_BASE}/manager/programs/${id}/deploy`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  return handleResponse<{ id: number; title: string; status: string; deployedAt: string; inviteUrl: string }>(res);
}

export async function unpublishProgram(id: number): Promise<ChallengeProgram & { message?: string }> {
  const res = await fetch(`${API_BASE}/manager/programs/${id}/unpublish`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  return handleResponse<ChallengeProgram & { message?: string }>(res);
}

export async function archiveProgram(id: number): Promise<{ id: number; title: string; status: string; archivedAt: string }> {
  const res = await fetch(`${API_BASE}/manager/programs/${id}/archive`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  return handleResponse<{ id: number; title: string; status: string; archivedAt: string }>(res);
}

export async function deleteProgram(id: number): Promise<{ message: string; id: number }> {
  const res = await fetch(`${API_BASE}/manager/programs/${id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  return handleResponse<{ message: string; id: number }>(res);
}
