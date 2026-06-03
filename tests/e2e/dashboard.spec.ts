import { test, expect, type ElectronApplication, type Page } from '@playwright/test';
import { _electron as electron } from 'playwright';
import electronPath from 'electron';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const appMain = path.join(process.cwd(), '.vite', 'build', 'main.js');

async function launchApp(): Promise<{ app: ElectronApplication; page: Page; userDataDir: string }> {
  expect(fs.existsSync(appMain), `${appMain} must exist. Run "npm run package" before the E2E suite.`).toBe(true);

  const userDataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'risotron-e2e-user-data-'));
  const app = await electron.launch({
    executablePath: electronPath as unknown as string,
    args: [`--user-data-dir=${userDataDir}`, appMain],
  });
  const page = await app.firstWindow();
  await page.waitForLoadState('domcontentloaded');

  return { app, page, userDataDir };
}

/**
 * Drive the 5-step Create Project wizard to completion.
 * After this returns, the dashboard is visible with the newly created project.
 */
async function createProjectViaWizard(page: Page, name: string, projectPath: string): Promise<void> {
  // Click the "New Project" button (topbar or empty-state)
  const newProjectBtn = page.getByRole('button', { name: /new project|create new project/i }).first();
  await expect(newProjectBtn).toBeVisible();
  await newProjectBtn.click();

  // Step 1 — Project Info
  await expect(page.getByRole('heading', { name: 'Create New Project' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Name the workspace' })).toBeVisible();
  await page.getByLabel('Name').fill(name);
  await page.getByLabel('Project path').fill(projectPath);
  await page.getByRole('button', { name: /next/i }).click();

  // Step 2 — Template
  await expect(page.getByRole('heading', { name: 'Choose a starting point' })).toBeVisible();
  await page.getByRole('button', { name: /next/i }).click();

  // Step 3 — Release
  await expect(page.getByRole('heading', { name: 'Set up publishing' })).toBeVisible();
  await page.getByRole('button', { name: /next/i }).click();

  // Step 4 — CI/CD
  await expect(page.getByRole('heading', { name: 'Choose build targets' })).toBeVisible();
  await page.getByRole('button', { name: /next/i }).click();

  // Step 5 — Review & submit
  await expect(page.getByRole('heading', { name: 'Confirm project setup' })).toBeVisible();
  await page.getByRole('button', { name: 'Create Project' }).click();

  // Wait for wizard to close and project to appear on dashboard
  // Scaffold (Electron Forge + npm install) can take several minutes
  await expect(page.getByRole('heading', { name: 'Create New Project' })).toHaveCount(0, { timeout: 300_000 });
  await expect(page.getByText(name).first()).toBeVisible({ timeout: 300_000 });
}

test.describe('Project Dashboard Filters', () => {
  // Two full wizard flows + filter operations can exceed the default 60s timeout
  test.setTimeout(900_000); // 15 min — two full scaffold flows (Forge + npm install)

  test('search and filter projects on the dashboard', async () => {
    const ts = Date.now();
    const alphaName = `Project Alpha ${ts}`;
    const betaName = `Project Beta ${ts}`;
    const alphaPath = path.join(os.tmpdir(), `risotron-e2e-alpha-${ts}`);
    const betaPath = path.join(os.tmpdir(), `risotron-e2e-beta-${ts}`);
    const { app, page, userDataDir } = await launchApp();

    try {
      // ── Create two projects through the wizard ──
      await createProjectViaWizard(page, alphaName, alphaPath);
      await createProjectViaWizard(page, betaName, betaPath);

      // Both projects should now be visible on the dashboard
      await expect(page.getByText(alphaName).first()).toBeVisible();
      await expect(page.getByText(betaName).first()).toBeVisible();

      // ── Test text search: type "Alpha" ──
      const searchInput = page.locator('#search-projects-input');
      await searchInput.fill('Alpha');
      await expect(page.getByText(alphaName).first()).toBeVisible();
      await expect(page.getByText(betaName)).toHaveCount(0);

      // ── Test clear filters: click #clear-filters-btn ──
      const clearBtn = page.locator('#clear-filters-btn');
      await expect(clearBtn).toBeVisible();
      await clearBtn.click();
      await expect(page.getByText(alphaName).first()).toBeVisible();
      await expect(page.getByText(betaName).first()).toBeVisible();
      // After clearing, the button should disappear (filters are at defaults)
      await expect(clearBtn).toHaveCount(0);

      // ── Test empty state: search for a nonexistent string ──
      await searchInput.fill('zzz_nonexistent_xyz');
      await expect(page.getByRole('heading', { name: 'No matching projects' })).toBeVisible();
      await expect(page.locator('#empty-clear-filters-btn')).toBeVisible();

      // Clear from the empty-state button and verify recovery
      await page.locator('#empty-clear-filters-btn').click();
      await expect(page.getByText(alphaName).first()).toBeVisible();
      await expect(page.getByText(betaName).first()).toBeVisible();
    } finally {
      await app.close();
      fs.rmSync(userDataDir, { recursive: true, force: true });
      fs.rmSync(alphaPath, { recursive: true, force: true });
      fs.rmSync(betaPath, { recursive: true, force: true });
    }
  });
});
