import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');
const BASE_URL = __ENV.API_URL; // || 'http://localhost:4000/api/v1';

export const options = {
  stages: [
    { duration: '1m', target: 10 },   // Ramp up to 10 users
    { duration: '3m', target: 10 },   // Stay at 10 users
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'],     // 95% under 500ms
    'http_req_failed': ['rate<0.01'],       // Less than 1% errors
    'errors': ['rate<0.05'],                // Less than 5% custom errors
  },
};

export default function () {
  // Test 1: Health Check
  const healthRes = http.get(`${BASE_URL}/health`);
  check(healthRes, {
    'health check is 200': (r) => r.status === 200,
    'health has status ok': (r) => r.json('status') === 'ok',
  }) || errorRate.add(1);

  sleep(1);

  // Test 2: Get Properties
  const propRes = http.get(`${BASE_URL}/property`);
  check(propRes, {
    'property status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(1);

  // Test 3: Get Room Types
  const roomTypesRes = http.get(`${BASE_URL}/room-types`);
  check(roomTypesRes, {
    'room types status is 200': (r) => r.status === 200,
  }) || errorRate.add(1);

  sleep(2);
}
