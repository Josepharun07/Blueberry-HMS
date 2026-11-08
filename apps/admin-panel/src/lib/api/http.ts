import { getApiUrl } from './config';

let csrfToken: string | null = null;

export function setCsrfToken(token: string | null) {
  csrfToken = token;
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers);
  const method = (options.method ?? 'GET').toUpperCase();
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && csrfToken) {
    headers.set('x-csrf-token', csrfToken);
  }

  const response = await fetch(getApiUrl(path), {
    ...options,
    headers,
    credentials: 'include',
  });

  if (response.status === 401 && !path.includes('/auth/login') && !path.includes('/auth/me')) {
    window.location.assign('/login');
  }

  return response;
}
