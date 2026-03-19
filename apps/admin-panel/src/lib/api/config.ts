export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
  apiPrefix: '/api/v1',
  timeout: 30000,
};

export const getApiUrl = (endpoint: string) => {
  return `${API_CONFIG.baseURL}${API_CONFIG.apiPrefix}${endpoint}`;
};
