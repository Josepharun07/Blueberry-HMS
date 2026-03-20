import http from 'k6/http';
import { check } from 'k6';

const BASE_URL = __ENV.API_URL;

export const options = {
  stages: [
    { duration: '10s', target: 0 },      // Start at 0
    { duration: '10s', target: 100 },    // SPIKE to 100 users
    { duration: '1m', target: 100 },     // Sustained spike
    { duration: '10s', target: 0 },      // Drop back
  ],
  thresholds: {
    'http_req_failed': ['rate<0.1'],     // Allow 10% failure during spike
    'http_req_duration': ['p(95)<2000'], // Relaxed threshold
  },
};

export default function () {
  const res = http.get(`${BASE_URL}/health`);
  
  check(res, {
    'health check succeeded': (r) => r.status === 200,
    'response time acceptable': (r) => r.timings.duration < 2000,
  });
}
