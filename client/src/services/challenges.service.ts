import { PublicChallenge, JoinChallengeResponse } from '../types/challenge.types.js';

const API_BASE = '/api';

export class ChallengeApiError extends Error {
  code: string;

  constructor(message: string, code = 'API_ERROR') {
    super(message);
    this.name = 'ChallengeApiError';
    this.code = code;
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let errBody: { error?: { code?: string; message?: string } } = {};
    try {
      errBody = await res.json();
    } catch {
      // response might not be JSON
    }
    const message = errBody.error?.message || `Request failed with status ${res.status}`;
    const code = errBody.error?.code || 'API_ERROR';
    throw new ChallengeApiError(message, code);
  }
  return res.json() as Promise<T>;
}

export async function fetchPublicChallenge(id: number): Promise<PublicChallenge> {
  const res = await fetch(`${API_BASE}/challenges/${id}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  return handleResponse<PublicChallenge>(res);
}

export async function joinChallenge(id: number): Promise<JoinChallengeResponse> {
  const res = await fetch(`${API_BASE}/challenges/${id}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  return handleResponse<JoinChallengeResponse>(res);
}
