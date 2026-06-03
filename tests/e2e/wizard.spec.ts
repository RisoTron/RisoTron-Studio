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

test.describe('Create Project Wizard', () => {
  test('creates a project from the wizard happy path', async () => {
    test.setTimeout(300_000); // 5 min — forge + npm install take time

    const projectName = `E2E Wizard Project ${Date.now()}`;
    const projectPath = path.join(os.tmpdir(), `risotron-e2e-project-${Date.now()}`);
    const { app, page, userDataDir } = await launchApp();

    try {
      await expect(page.getByRole('button', { name: /new project|create new project/i }).first()).toBeVisible();
      await page.getByRole('button', { name: /new project|create new project/i }).first().click();

      await expect(page.getByRole('heading', { name: 'Create New Project' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Name the workspace' })).toBeVisible();

      await page.getByLabel('Name').fill(projectName);
      await page.getByLabel('Project path').fill(projectPath);
      await page.getByRole('button', { name: /next/i }).click();

      await expect(page.getByRole('heading', { name: 'Choose a starting point' })).toBeVisible();
      await page.getByRole('button', { name: /next/i }).click();

      await expect(page.getByRole('heading', { name: 'Set up publishing' })).toBeVisible();
      await page.getByRole('button', { name: /next/i }).click();

      await expect(page.getByRole('heading', { name: 'Choose build targets' })).toBeVisible();
      await page.getByRole('button', { name: /next/i }).click();

      await expect(page.getByRole('heading', { name: 'Confirm project setup' })).toBeVisible();
      await expect(page.getByText(projectName)).toBeVisible();
      await expect(page.getByText(projectPath)).toBeVisible();

      await page.getByRole('button', { name: 'Create Project' }).click();

      await expect(page.getByRole('heading', { name: 'Create New Project' })).toHaveCount(0);
      await expect(page.getByText(projectName)).toBeVisible();
      expect(fs.existsSync(projectPath)).toBe(true);
      expect(fs.existsSync(path.join(projectPath, 'risotron.json'))).toBe(true);
    } finally {
      await app.close();
      fs.rmSync(userDataDir, { recursive: true, force: true });
      fs.rmSync(projectPath, { recursive: true, force: true });
    }
  });

  test('disables Next on the first step until required project fields are valid', async () => {
    const { app, page, userDataDir } = await launchApp();

    try {
      await page.getByRole('button', { name: /new project|create new project/i }).first().click();

      await expect(page.getByRole('heading', { name: 'Name the workspace' })).toBeVisible();
      await expect(page.getByRole('button', { name: /next/i })).toBeDisabled();
    } finally {
      await app.close();
      fs.rmSync(userDataDir, { recursive: true, force: true });
    }
  });
});
