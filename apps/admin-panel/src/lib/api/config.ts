function apiOrigin(): string {
  const value = import.meta.env.VITE_API_URL;
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error('VITE_API_URL is not set');
  }
  return value.trim().replace(/\/$/, '');
}

export function getApiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${apiOrigin()}${normalized}`;
}
