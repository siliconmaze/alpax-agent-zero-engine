import { http, HttpResponse } from 'msw';

// Mock Agent Zero API responses
export const handlers = [
  // Health endpoint
  http.get('/api/agent-zero/health', () =>
    HttpResponse.json({
      gitinfo: { branch: 'main', commit: 'e2e-test-0001' },
      error: null,
    })
  ),

  // Create session / send message
  http.post('/api/agent-zero/message', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;

    if (body.message === 'Initialize session' || body.project_name) {
      return HttpResponse.json({
        context_id: `ctx-e2e-${Date.now()}`,
        response: 'Session initialized successfully.',
      });
    }

    if (typeof body.message === 'string' && body.message.length > 0) {
      return HttpResponse.json({
        context_id: body.context_id ?? 'ctx-e2e-001',
        response: 'This is a mocked Agent Zero response to your message: ' + body.message,
      });
    }

    return HttpResponse.json({ error: 'Invalid request' }, { status: 400 });
  }),

  // Sessions list
  http.get('/api/agent-zero/sessions', () =>
    HttpResponse.json({
      sessions: [
        {
          context_id: 'ctx-e2e-001',
          project_name: 'e2e-test-project',
          created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
          last_message_at: new Date(Date.now() - 60000).toISOString(),
          status: 'active',
          message_count: 42,
          token_estimate: 84000,
        },
        {
          context_id: 'ctx-e2e-002',
          project_name: 'playwright-e2e',
          created_at: new Date(Date.now() - 86400000).toISOString(),
          last_message_at: new Date(Date.now() - 3600000).toISOString(),
          status: 'idle',
          message_count: 15,
          token_estimate: 21000,
        },
      ],
    })
  ),

  // Metrics
  http.get('/api/agent-zero/metrics', () =>
    HttpResponse.json({
      total_tokens: 987654,
      total_cost: 2.34,
      avg_latency_ms: 1420,
      messages_today: 18,
      active_sessions: 2,
    })
  ),

  // Memory
  http.get('/api/agent-zero/memory', () =>
    HttpResponse.json({
      memories: [
        { id: 'mem-001', content: 'E2E test memory entry one', project_name: 'e2e-test', created_at: new Date().toISOString(), relevance: 0.95 },
        { id: 'mem-002', content: 'Playwright is a great testing framework', project_name: 'e2e-test', created_at: new Date().toISOString(), relevance: 0.88 },
      ],
    })
  ),

  // Settings
  http.post('/api/agent-zero/settings', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    if (body.api_url) {
      return HttpResponse.json({ success: true, settings: body });
    }
    return HttpResponse.json({ success: false, error: 'Missing api_url' }, { status: 400 });
  }),

  // Connection test
  http.post('/api/agent-zero/test-connection', async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    if (typeof body.api_url === 'string' && body.api_url.includes('invalid')) {
      return HttpResponse.json({ connected: false, error: 'Connection refused' });
    }
    return HttpResponse.json({ connected: true, latency_ms: 42 });
  }),
];
