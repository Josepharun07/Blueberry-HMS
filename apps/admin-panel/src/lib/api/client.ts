import axios from 'axios';
import { getApiUrl } from './config';

export const apiClient = {
  post: (url: string, data?: unknown) =>
    axios.post(getApiUrl(`/api/v1${url}`), data, {
      withCredentials: true,
      headers: { 'Content-Type': 'application/json' },
    }),
  get: (url: string) =>
    axios.get(getApiUrl(`/api/v1${url}`), { withCredentials: true }),
};
