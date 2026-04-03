// Mock route definitions for Playwright page.route() — no MSW browser worker needed.
// These functions are imported as plain values (CommonJS-safe) and called at runtime.
import type { Page } from '@playwright/test';

export function setupMocks(page: Page) {
  // Health
  page.route('**/api/agent-zero/health', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ gitinfo: { branch: 'main', commit: 'e2e-test-0001' }, error: null }) })
  );
  // Message (create session + chat)
  page.route('**/api/agent-zero/message', async (route) => {
    const body = route.request().postData() ? JSON.parse(route.request().postData()!) : {};
    if (body.message === 'Initialize session' || body.project_name) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ context_id: `ctx-e2e-${Date.now()}`, response: 'Session initialized.' }) });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ context_id: body.context_id ?? 'ctx-e2e-001', response: 'Mocked Agent Zero response to: ' + body.message }) });
  });
  // Sessions list
  page.route('**/api/agent-zero/sessions', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ sessions: [] }) })
  );
  // Metrics
  page.route('**/api/agent-zero/metrics', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ total_tokens: 987654, total_cost: 2.34, avg_latency_ms: 1420, messages_today: 18, active_sessions: 2 }) })
  );
  // Memory
  page.route('**/api/agent-zero/memory', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ memories: [] }) })
  );
  // Settings
  page.route('**/api/agent-zero/settings', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) })
  );
  // Test connection
  page.route('**/api/agent-zero/test-connection', async (route) => {
    const body = route.request().postData() ? JSON.parse(route.request().postData()!) : {};
    if (body.api_url && body.api_url.includes('invalid')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ connected: false, error: 'Connection refused' }) });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ connected: true, latency_ms: 42 }) });
  });
}
