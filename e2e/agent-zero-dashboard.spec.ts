import { test, expect, Page } from '@playwright/test';
import { setupMocks } from './browser';

// ─── Setup ──────────────────────────────────────────────────────────────────

test.beforeEach(async ({ page }) => {
  setupMocks(page);
  await page.goto('/');
  await page.waitForSelector('h1:has-text("Alpax Agent Zero")', { timeout: 15000 });
});

// ─── Helpers ────────────────────────────────────────────────────────────────

async function navTo(page: Page, label: string) {
  await page.getByRole('button', { name: label }).click();
  await page.waitForTimeout(300);
}

async function openCommandPalette(page: Page) {
  await page.keyboard.press('Control+k');
  await expect(page.locator('input[placeholder="Type a command..."]')).toBeVisible({ timeout: 5000 });
}

async function openCommandPaletteViaButton(page: Page) {
  await page.getByRole('button', { name: 'Cmd+K' }).click();
  await expect(page.locator('input[placeholder="Type a command..."]')).toBeVisible({ timeout: 5000 });
}

// ─── 1. Dashboard Load ─────────────────────────────────────────────────────

test.describe('1. Dashboard Load', () => {
  test('renders on port 4001 with title', async ({ page }) => {
    await expect(page).toHaveURL(/localhost:4001/);
    await expect(page.locator('h1')).toContainText('Alpax Agent Zero');
  });

  test('all navigation items are visible', async ({ page }) => {
    for (const label of ['Kanban', 'Sessions', 'Observability', 'Memory', 'Settings']) {
      await expect(page.getByRole('button', { name: label })).toBeVisible();
    }
  });

  test('Kanban lanes render', async ({ page }) => {
    // Lane headings are <h3> inside the lane component
    for (const label of ['Now', 'Backlog', 'Done', 'Next', 'Halted']) {
      await expect(page.locator('h3', { hasText: label })).toBeVisible();
    }
  });

  test('demo cards render in the Kanban board', async ({ page }) => {
    await expect(page.locator('text=Connect to Agent Zero API')).toBeVisible();
    await expect(page.locator('text=Build Sessions Panel')).toBeVisible();
    await expect(page.locator('text=Scaffold Next.js Engine')).toBeVisible();
  });

  test('priority badges display on cards', async ({ page }) => {
    await expect(page.locator('text=P0').first()).toBeVisible();
  });

  test('model override badge shows', async ({ page }) => {
    await expect(page.locator('text=minimax/m2.7').first()).toBeVisible();
  });

  test('connection status indicator visible in header', async ({ page }) => {
    await expect(
      page.locator('text=Agent Zero Connected').or(page.locator('text=Not Connected'))
    ).toBeVisible();
  });
});

// ─── 2. Agent Sessions Panel ────────────────────────────────────────────────

test.describe('2. Agent Sessions Panel', () => {
  test('renders with demo sessions', async ({ page }) => {
    await navTo(page, 'Sessions');
    await expect(page.locator('h2', { hasText: 'Sessions' })).toBeVisible();
    await expect(page.locator('text=raytranscribes-refactor')).toBeVisible();
    await expect(page.locator('text=alpax-agent-zero-engine')).toBeVisible();
  });

  test('session status badges display', async ({ page }) => {
    await navTo(page, 'Sessions');
    await expect(page.locator('text=active').first()).toBeVisible();
    await expect(page.locator('text=idle').first()).toBeVisible();
    await expect(page.locator('text=expired').first()).toBeVisible();
  });

  test('create new session via New button', async ({ page }) => {
    await navTo(page, 'Sessions');
    await page.getByRole('button', { name: /New/ }).click();
    await expect(page.locator('input[placeholder="Project name (optional)"]')).toBeVisible();
    await page.fill('input[placeholder="Project name (optional)"]', 'playwright-e2e-test');
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page.locator('text=playwright-e2e-test').first()).toBeVisible({ timeout: 5000 });
  });

  test('selecting session shows chat area', async ({ page }) => {
    await navTo(page, 'Sessions');
    await page.locator('button', { hasText: 'raytranscribes-refactor' }).click();
    await page.waitForTimeout(300);
    await expect(page.locator('textarea').first()).toBeVisible();
  });

  test('send message gets response', async ({ page }) => {
    await navTo(page, 'Sessions');
    await page.locator('button', { hasText: 'raytranscribes-refactor' }).click();
    await page.waitForTimeout(300);
    await page.locator('textarea').first().fill('Hello Agent Zero');
    await page.getByRole('button', { name: /Send/ }).click();
    // Should show Agent Zero response area (either mocked response or error)
    await expect(
      page.locator('.rounded-xl.border-emerald-800').first()
    ).toBeVisible({ timeout: 10000 });
  });
});

// ─── 3. Command Palette ────────────────────────────────────────────────────

test.describe('3. Command Palette', () => {
  test('Ctrl+K opens the command palette', async ({ page }) => {
    await expect(page.locator('input[placeholder="Type a command..."]')).not.toBeVisible();
    await openCommandPalette(page);
  });

  test('Cmd+K button also opens the palette', async ({ page }) => {
    await openCommandPaletteViaButton(page);
  });

  test('all command options are listed', async ({ page }) => {
    await openCommandPalette(page);
    for (const cmd of ['/new', '/session', '/search', '/metrics', '/model', '/settings']) {
      await expect(page.locator(`text=${cmd}`)).toBeVisible();
    }
  });

  test('typing filters commands', async ({ page }) => {
    await openCommandPalette(page);
    await page.fill('input[placeholder="Type a command..."]', 'new');
    await expect(page.locator('text=/new')).toBeVisible();
    await expect(page.locator('text=/session')).not.toBeVisible();
  });

  test('/new creates a Kanban card', async ({ page }) => {
    await openCommandPalette(page);
    await page.locator('button', { hasText: '/new' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('input[placeholder="Type a command..."]')).not.toBeVisible();
    await expect(page.locator('text=New Card').first()).toBeVisible();
  });

  test('/settings navigates to settings', async ({ page }) => {
    await openCommandPalette(page);
    await page.fill('input[placeholder="Type a command..."]', 'settings');
    await page.locator('button', { hasText: '/settings' }).click();
    await page.waitForTimeout(500);
    await expect(page.locator('h2', { hasText: 'Settings' })).toBeVisible();
  });

  test('Escape closes the command palette', async ({ page }) => {
    await openCommandPalette(page);
    await page.keyboard.press('Escape');
    await expect(page.locator('input[placeholder="Type a command..."]')).not.toBeVisible({ timeout: 3000 });
  });

  test('clicking backdrop closes command palette', async ({ page }) => {
    await openCommandPalette(page);
    await page.locator('[aria-label="Close palette"]').click({ force: true });
    await expect(page.locator('input[placeholder="Type a command..."]')).not.toBeVisible({ timeout: 3000 });
  });
});

// ─── 4. Settings Panel ─────────────────────────────────────────────────────

test.describe('4. Settings Panel', () => {
  test('renders all form fields', async ({ page }) => {
    await navTo(page, 'Settings');
    await expect(page.locator('h2', { hasText: 'Settings' })).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#settings-api-url')).toBeVisible();
    await expect(page.locator('#settings-api-key')).toBeVisible();
    await expect(page.locator('#btn-test-connection')).toBeVisible();
    await expect(page.locator('#btn-save-settings')).toBeVisible();
  });

  test('API URL input has default value', async ({ page }) => {
    await navTo(page, 'Settings');
    await expect(page.locator('#settings-api-url')).toHaveValue('http://localhost:50080');
  });

  test('API key is a password field', async ({ page }) => {
    await navTo(page, 'Settings');
    await expect(page.locator('#settings-api-key')).toHaveAttribute('type', 'password');
  });

  test('test connection shows result', async ({ page }) => {
    await navTo(page, 'Settings');
    await page.locator('#btn-test-connection').click();
    await expect(page.locator('#connection-status')).not.toBeEmpty({ timeout: 5000 });
  });

  test('test connection shows failure for invalid URL', async ({ page }) => {
    await navTo(page, 'Settings');
    await page.locator('#settings-api-url').fill('http://invalid.test.endpoint.local');
    await page.locator('#btn-test-connection').click();
    await expect(page.locator('#connection-status')).toContainText('Failed', { timeout: 5000 });
  });

  test('save settings shows confirmation', async ({ page }) => {
    await navTo(page, 'Settings');
    await page.locator('#btn-save-settings').click();
    await expect(page.locator('#save-status')).toContainText('Settings saved', { timeout: 5000 });
  });
});

// ─── 5. Kanban Board ───────────────────────────────────────────────────────

test.describe('5. Kanban Board', () => {
  test('clicking a card opens detail panel', async ({ page }) => {
    await page.locator('.group', { hasText: 'Connect to Agent Zero API' }).first().click();
    await page.waitForTimeout(500);
    await expect(page.locator('text=Card Details')).toBeVisible();
    await expect(page.locator('text=Connect to Agent Zero API')).toHaveCount(2); // card + detail panel
  });

  test('card detail panel shows description', async ({ page }) => {
    await page.locator('.group', { hasText: 'Connect to Agent Zero API' }).first().click();
    await page.waitForTimeout(300);
    await expect(page.locator('text=Set up agent-zero-client.ts').first()).toBeVisible();
  });

  test('card detail panel shows Agent Zero context ID', async ({ page }) => {
    await page.locator('.group', { hasText: 'Connect to Agent Zero API' }).first().click();
    await page.waitForTimeout(300);
    await expect(page.locator('text=ctx-az-001')).toBeVisible();
  });

  test('close button dismisses card detail', async ({ page }) => {
    await page.locator('.group', { hasText: 'Connect to Agent Zero API' }).first().click();
    await page.waitForTimeout(300);
    await expect(page.locator('text=Card Details')).toBeVisible();
    await page.locator('button', { hasText: '✕' }).click();
    await expect(page.locator('text=Card Details')).not.toBeVisible();
  });

  test('owner badge shows correct owner', async ({ page }) => {
    const card = page.locator('.group', { hasText: 'Connect to Agent Zero API' }).first();
    await expect(card.locator('text=Build')).toBeVisible();
  });

  test('running status shows pulse indicator', async ({ page }) => {
    const card = page.locator('.group', { hasText: 'Connect to Agent Zero API' }).first();
    await expect(card.locator('text=running')).toBeVisible();
    await expect(card.locator('.animate-pulse')).toBeVisible();
  });

  test('blocked reason shows on card', async ({ page }) => {
    const card = page.locator('.group', { hasText: 'Build Sessions Panel' }).first();
    await expect(card.locator('text=Waiting for API client')).toBeVisible();
  });

  test('lane collapse hides cards', async ({ page }) => {
    // Find the collapse button in the Now lane (Minimize2 icon button with title "Collapse")
    const nowLane = page.locator('h3', { hasText: 'Now' }).locator('..');
    const collapseBtn = nowLane.locator('button[title="Collapse"]');
    await collapseBtn.click();
    await page.waitForTimeout(300);
    // Cards should be hidden
    await expect(page.locator('.group', { hasText: 'Connect to Agent Zero API' }).first()).not.toBeVisible();
    // Expand again
    const expandBtn = nowLane.locator('button[title="Expand"]');
    await expandBtn.click();
    await page.waitForTimeout(300);
    await expect(page.locator('.group', { hasText: 'Connect to Agent Zero API' }).first()).toBeVisible();
  });

  test('add card button creates new card', async ({ page }) => {
    // The add button is hidden until hover, so force-click it
    const backlogLane = page.locator('h3', { hasText: 'Backlog' }).locator('..').locator('..');
    const addBtn = backlogLane.locator('button[title="Add card"]');
    await addBtn.click({ force: true });
    await page.waitForTimeout(300);
    await expect(page.locator('text=New Card').first()).toBeVisible();
  });
});

// ─── 6. Observability Widgets ──────────────────────────────────────────────

test.describe('6. Observability Widgets', () => {
  test.beforeEach(async ({ page }) => {
    await navTo(page, 'Observability');
  });

  test('heading and all four widgets render', async ({ page }) => {
    await expect(page.locator('h2', { hasText: 'Observability' })).toBeVisible();
    await expect(page.locator('h3', { hasText: 'Tokens' })).toBeVisible();
    await expect(page.locator('h3', { hasText: 'Latency' })).toBeVisible();
    await expect(page.locator('h3', { hasText: 'Cost' })).toBeVisible();
    await expect(page.locator('h3', { hasText: 'Model Usage' })).toBeVisible();
  });

  test('token counter shows formatted value', async ({ page }) => {
    // Default is 1247850 which formats to "1.2M"
    await expect(page.locator('text=1.2M')).toBeVisible();
    await expect(page.locator('text=total tokens consumed')).toBeVisible();
  });

  test('token widget shows session count', async ({ page }) => {
    await expect(page.locator('text=3 sessions')).toBeVisible();
  });

  test('cost widget shows total dollar amount', async ({ page }) => {
    // Total is $22.03
    await expect(page.locator('text=$22.03')).toBeVisible();
  });

  test('cost widget shows per-model breakdown', async ({ page }) => {
    await expect(page.locator('text=Claude Sonnet').first()).toBeVisible();
    await expect(page.locator('text=$8.42')).toBeVisible();
  });

  test('latency widget shows model latencies in ms', async ({ page }) => {
    await expect(page.locator('text=1842ms')).toBeVisible();
    await expect(page.locator('text=987ms')).toBeVisible();
  });

  test('latency widget shows average', async ({ page }) => {
    await expect(page.locator('text=avg 1706ms')).toBeVisible();
  });

  test('model usage widget shows call counts', async ({ page }) => {
    await expect(page.locator('text=MiniMax M2.7').first()).toBeVisible();
    await expect(page.locator('text=/847.*41%/').first()).toBeVisible();
  });
});

// ─── 7. Memory View ────────────────────────────────────────────────────────

test.describe('7. Memory View', () => {
  test('shows coming soon placeholder', async ({ page }) => {
    await navTo(page, 'Memory');
    await expect(page.locator('text=Memory Dashboard')).toBeVisible();
    await expect(page.locator('text=Coming soon')).toBeVisible();
  });
});

// ─── 8. Navigation ─────────────────────────────────────────────────────────

test.describe('8. Navigation', () => {
  test('switching tabs shows correct content', async ({ page }) => {
    // Start on Kanban
    await expect(page.locator('h3', { hasText: 'Now' })).toBeVisible();

    // Switch to Sessions
    await navTo(page, 'Sessions');
    await expect(page.locator('h2', { hasText: 'Sessions' })).toBeVisible();

    // Switch to Observability
    await navTo(page, 'Observability');
    await expect(page.locator('h2', { hasText: 'Observability' })).toBeVisible();

    // Switch to Memory
    await navTo(page, 'Memory');
    await expect(page.locator('text=Coming soon')).toBeVisible();

    // Switch to Settings
    await navTo(page, 'Settings');
    await expect(page.locator('h2', { hasText: 'Settings' })).toBeVisible();

    // Back to Kanban
    await navTo(page, 'Kanban');
    await expect(page.locator('h3', { hasText: 'Now' })).toBeVisible();
  });

  test('active tab is highlighted', async ({ page }) => {
    const kanbanBtn = page.getByRole('button', { name: 'Kanban' });
    await expect(kanbanBtn).toHaveClass(/text-cyan-400/);

    await navTo(page, 'Sessions');
    const sessionsBtn = page.getByRole('button', { name: 'Sessions' });
    await expect(sessionsBtn).toHaveClass(/text-cyan-400/);
    await expect(kanbanBtn).not.toHaveClass(/text-cyan-400/);
  });
});
