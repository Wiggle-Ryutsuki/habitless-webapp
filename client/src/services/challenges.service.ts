import {
  PublicChallenge,
  ChallengeItem,
  JoinChallengeResponse,
  LeaveChallengeResponse,
  SyncChallengeResponse,
  RateChallengeResponse,
  ChallengeCommentItem,
} from '../types/challenge.types.js';

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

export interface FetchChallengesParams {
  q?: string;
  category?: string;
  status?: string;
}

export async function fetchChallenges(params?: FetchChallengesParams): Promise<ChallengeItem[]> {
  const query = new URLSearchParams();
  if (params?.q) query.set('q', params.q);
  if (params?.category) query.set('category', params.category);
  if (params?.status) query.set('status', params.status);

  const qs = query.toString();
  const url = `${API_BASE}/challenges${qs ? `?${qs}` : ''}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  return handleResponse<ChallengeItem[]>(res);
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

export async function leaveChallenge(id: number, action: 'KEEP' | 'REMOVE'): Promise<LeaveChallengeResponse> {
  const res = await fetch(`${API_BASE}/challenges/${id}/leave`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
    credentials: 'include',
  });
  return handleResponse<LeaveChallengeResponse>(res);
}

export async function syncChallenge(id: number): Promise<SyncChallengeResponse> {
  const res = await fetch(`${API_BASE}/challenges/${id}/sync`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
  });
  return handleResponse<SyncChallengeResponse>(res);
}

export async function rateChallenge(id: number, rating: number): Promise<RateChallengeResponse> {
  const res = await fetch(`${API_BASE}/challenges/${id}/rating`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rating }),
    credentials: 'include',
  });
  return handleResponse<RateChallengeResponse>(res);
}

export async function postChallengeComment(
  id: number,
  content: string,
  parentCommentId: number | null = null
): Promise<ChallengeCommentItem> {
  const res = await fetch(`${API_BASE}/challenges/${id}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, parentCommentId }),
    credentials: 'include',
  });
  return handleResponse<ChallengeCommentItem>(res);
}
