import { test, expect } from '@playwright/test';

test.describe('Feature 1: Authentication & RBAC E2E Flows', () => {
  const uniqueEmail = `playwright.user.${Date.now()}@example.com`;
  const password = 'SecurePassword123!';

  test('E2E-01: Participant Registration, Session Persistence, and Logout Journey', async ({ page }) => {
    // 1. Navigate to Registration
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: /habitless/i })).toBeVisible();

    // 2. Fill registration form as PARTICIPANT
    await page.getByLabel(/full name/i).fill('Playwright Participant');
    await page.getByLabel(/email address/i).fill(uniqueEmail);
    await page.getByLabel(/^password/i).fill(password);
    await page.getByLabel(/participant/i).check();

    // 3. Submit
    await page.getByRole('button', { name: /create account/i }).click();

    // 4. Verify redirected to /calendar and header displays user name and role badge
    await page.waitForURL('**/calendar');
    await expect(page.getByText('Playwright Participant')).toBeVisible();
    await expect(page.getByText('Participant', { exact: true })).toBeVisible();

    // 5. Test session persistence on page reload (verifying no race-condition redirect to /login)
    await page.reload();
    await page.waitForURL('**/calendar');
    await expect(page.getByText('Playwright Participant')).toBeVisible();

    // 6. Log out
    await page.getByRole('button', { name: /log out/i }).click();
    await page.waitForURL('**/login');
  });

  test('E2E-03: Program Manager Login & RBAC Routing Journey', async ({ page }) => {
    // 1. Navigate to Login
    await page.goto('/login');

    // 2. Submit manager seed credentials
    await page.getByLabel(/email address/i).fill('manager@habitless.internal');
    await page.getByLabel(/^password/i).fill('ManagerPass123!');
    await page.getByRole('button', { name: /sign in/i }).click();

    // 3. Verify redirected to /manager
    await page.waitForURL('**/manager');
    await expect(page.getByRole('heading', { name: 'Challenge Programs' })).toBeVisible();
    await expect(page.getByText(/dr. jordan wells/i)).toBeVisible();

    // 4. Log out
    await page.getByRole('button', { name: /log out/i }).click();
    await page.waitForURL('**/login');
  });
});

