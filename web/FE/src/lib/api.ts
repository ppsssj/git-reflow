export const API_BASE_URL = import.meta.env.VITE_GIT_REFLOW_API_URL ?? 'http://localhost:8787';

export async function apiGet<TResponse>(path: string, init?: RequestInit): Promise<TResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...init?.headers,
    },
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
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const result = await response.json().catch(() => null);
    throw new Error(result?.error ?? `Request failed with ${response.status}`);
  }

  return response.json() as Promise<TResponse>;
}
