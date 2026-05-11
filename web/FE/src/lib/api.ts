import { getAuthSession } from './auth';

export const API_BASE_URL = import.meta.env.VITE_GIT_REFLOW_API_URL ?? 'http://localhost:8787';

function getDefaultHeaders(init?: RequestInit) {
  const session = getAuthSession();

  return {
    Accept: 'application/json',
    ...(session?.token ? { Authorization: `Bearer ${session.token}` } : {}),
    ...init?.headers,
  };
}

export async function apiGet<TResponse>(path: string, init?: RequestInit): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: getDefaultHeaders(init),
  });

  if (!response.ok) {
    const result = await response.json().catch(() => null);
    throw new Error(result?.error ?? `Request failed with ${response.status}`);
  }

  return response.json() as Promise<TResponse>;
}

export async function apiPost<TResponse>(path: string, body: unknown, init?: RequestInit): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getDefaultHeaders(init),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const result = await response.json().catch(() => null);
    throw new Error(result?.error ?? `Request failed with ${response.status}`);
  }

  return response.json() as Promise<TResponse>;
}

export async function apiDelete<TResponse>(path: string, init?: RequestInit): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    method: 'DELETE',
    headers: getDefaultHeaders(init),
  });

  if (!response.ok) {
    const result = await response.json().catch(() => null);
    throw new Error(result?.error ?? `Request failed with ${response.status}`);
  }

  return response.json() as Promise<TResponse>;
}
