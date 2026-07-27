import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 100,
  duration: '1m',
  thresholds: {
    http_req_failed: ['rate<0.05'], // failure rate under 5%
    http_req_duration: ['p(95)<1500'], // 95% of requests under 1.5s
  },
};

export default function () {
  const backendUrl = __ENV.BACKEND_URL || 'http://127.0.0.1:5000';
  const url = `${backendUrl.replace(/\/+$/, '')}/health`;

  const res = http.get(url, {
    headers: {
      'Accept': 'application/json',
      'User-Agent': 'k6-load-test-agent'
    }
  });

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response body contains ok': (r) => r.body && r.body.includes('ok'),
  });

  sleep(0.1);
}
