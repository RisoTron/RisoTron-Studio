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
 * Navigate to the Credential Vault view by clicking the activity bar button.
 */
async function navigateToCredentialVault(page: Page): Promise<void> {
  const credBtn = page.locator('button.activity-icon[title="Credential Vault"]');
  await expect(credBtn).toBeVisible();
  await credBtn.click();
  await expect(page.getByRole('heading', { name: 'Credential Vault' })).toBeVisible();
}

/**
 * Open the Add Credential form by clicking the "+ Add Credential" button.
 */
async function openAddCredentialForm(page: Page): Promise<void> {
  const addBtn = page.getByRole('button', { name: '+ Add Credential' });
  await expect(addBtn).toBeVisible();
  await addBtn.click();
  await expect(page.locator('#cred-type')).toBeVisible();
}

test.describe('Credential Vault', () => {
  test.setTimeout(60_000);

  test('navigate to Credential Vault', async () => {
    const { app, page, userDataDir } = await launchApp();
    try {
      // Click the Credentials activity bar button
      await navigateToCredentialVault(page);

      // Assert heading is visible
      await expect(page.getByRole('heading', { name: 'Credential Vault' })).toBeVisible();

      // Assert "+ Add Credential" button is visible
      await expect(page.getByRole('button', { name: '+ Add Credential' })).toBeVisible();
    } finally {
      await app.close();
      fs.rmSync(userDataDir, { recursive: true, force: true });
    }
  });

  test('add a GitHub PAT credential', async () => {
    const { app, page, userDataDir } = await launchApp();
    try {
      await navigateToCredentialVault(page);
      await openAddCredentialForm(page);

      // Type should default to github-pat; select it explicitly for safety
      await page.locator('#cred-type').selectOption('github-pat');

      // Fill name
      await page.locator('#cred-name').fill('My GitHub PAT');

      // Fill token
      await page.locator('#cred-token').fill('ghp_test_token_12345');

      // Submit
      await page.getByRole('button', { name: 'Save Credential' }).click();

      // Assert success banner appears
      const successBanner = page.locator('.success-banner');
      await expect(successBanner).toBeVisible();
      await expect(successBanner).toContainText('My GitHub PAT');
      await expect(successBanner).toContainText('saved successfully');

      // Assert form is no longer visible (showForm toggled off)
      await expect(page.locator('#cred-type')).not.toBeVisible();
    } finally {
      await app.close();
      fs.rmSync(userDataDir, { recursive: true, force: true });
    }
  });

  test('duplicate name rejected', async () => {
    const { app, page, userDataDir } = await launchApp();
    try {
      await navigateToCredentialVault(page);

      // First credential
      await openAddCredentialForm(page);
      await page.locator('#cred-type').selectOption('github-pat');
      await page.locator('#cred-name').fill('Duplicate Test');
      await page.locator('#cred-token').fill('ghp_first_token_000');
      await page.getByRole('button', { name: 'Save Credential' }).click();
      await expect(page.locator('.success-banner')).toBeVisible();

      // Second credential with same name
      await openAddCredentialForm(page);
      await page.locator('#cred-type').selectOption('github-pat');
      await page.locator('#cred-name').fill('Duplicate Test');
      await page.locator('#cred-token').fill('ghp_second_token_111');
      await page.getByRole('button', { name: 'Save Credential' }).click();

      // Assert field error on name
      const fieldError = page.locator('.field-error');
      await expect(fieldError).toBeVisible();
      await expect(fieldError).toContainText('already exists', { ignoreCase: true });
    } finally {
      await app.close();
      fs.rmSync(userDataDir, { recursive: true, force: true });
    }
  });

  test('empty name rejected', async () => {
    const { app, page, userDataDir } = await launchApp();
    try {
      await navigateToCredentialVault(page);
      await openAddCredentialForm(page);

      // Leave name blank, fill token
      await page.locator('#cred-name').fill('');
      await page.locator('#cred-token').fill('ghp_some_token_999');
      await page.getByRole('button', { name: 'Save Credential' }).click();

      // Assert validation error on name field
      const fieldError = page.locator('.field-error');
      await expect(fieldError).toBeVisible();
      await expect(fieldError).toContainText(/name/i);
    } finally {
      await app.close();
      fs.rmSync(userDataDir, { recursive: true, force: true });
    }
  });

  test('empty token rejected', async () => {
    const { app, page, userDataDir } = await launchApp();
    try {
      await navigateToCredentialVault(page);
      await openAddCredentialForm(page);

      // Fill name, leave token blank
      await page.locator('#cred-name').fill('Valid Name');
      await page.locator('#cred-token').fill('');
      await page.getByRole('button', { name: 'Save Credential' }).click();

      // Assert validation error on token/value field
      const fieldError = page.locator('.field-error');
      await expect(fieldError).toBeVisible();
    } finally {
      await app.close();
      fs.rmSync(userDataDir, { recursive: true, force: true });
    }
  });

  test('switch type shows correct fields', async () => {
    const { app, page, userDataDir } = await launchApp();
    try {
      await navigateToCredentialVault(page);
      await openAddCredentialForm(page);

      // Default type (github-pat) — token field visible, aws fields not
      await expect(page.locator('#cred-token')).toBeVisible();
      await expect(page.locator('#cred-access-key-id')).not.toBeVisible();
      await expect(page.locator('#cred-secret')).not.toBeVisible();

      // Switch to AWS
      await page.locator('#cred-type').selectOption('aws');
      await expect(page.locator('#cred-access-key-id')).toBeVisible();
      await expect(page.locator('#cred-secret')).toBeVisible();
      await expect(page.locator('#cred-token')).not.toBeVisible();

      // Switch back to github-pat
      await page.locator('#cred-type').selectOption('github-pat');
      await expect(page.locator('#cred-token')).toBeVisible();
      await expect(page.locator('#cred-access-key-id')).not.toBeVisible();
      await expect(page.locator('#cred-secret')).not.toBeVisible();

      // Switch to generic-token — same fields as github-pat
      await page.locator('#cred-type').selectOption('generic-token');
      await expect(page.locator('#cred-token')).toBeVisible();
      await expect(page.locator('#cred-access-key-id')).not.toBeVisible();
      await expect(page.locator('#cred-secret')).not.toBeVisible();
    } finally {
      await app.close();
      fs.rmSync(userDataDir, { recursive: true, force: true });
    }
  });
});
