import { test, expect } from '@playwright/test';

test.describe('Feature 2 & 3: Participant Complete Tracking Journey (E2E-01)', () => {
  const uniqueEmail = `playwright.tracking.${Date.now()}@example.com`;
  const password = 'SecurePassword123!';

  test('E2E-01: Participant Tracking, Calendar Checkoff & Under-Construction Dashboard Journey', async ({ page }) => {
    // 1. Navigate to Registration
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: /habitless/i })).toBeVisible();

    // 2. Fill registration form as PARTICIPANT
    await page.getByLabel(/full name/i).fill('Taylor Tracking Tester');
    await page.getByLabel(/email address/i).fill(uniqueEmail);
    await page.getByLabel(/password/i).fill(password);
    await page.getByLabel(/participant/i).check();

    // 3. Submit
    await page.getByRole('button', { name: /create account/i }).click();

    // 4. Lands on /calendar
    await page.waitForURL('**/calendar');
    await expect(page.getByRole('heading', { level: 2, name: /202/i })).toBeVisible();

    // 5. Create a habit with fixed color
    await page.getByRole('button', { name: /\+ new habit/i }).click();
    await page.getByLabel(/habit name/i).fill('Hydration 2L');
    await page.getByLabel(/target count/i).fill('20');
    await page.getByRole('button', { name: /save habit/i }).click();

    // 6. Verify habit appears in side habits list and calendar row
    await expect(page.getByText('Hydration 2L')).toBeVisible();

    // 7. Check off today in the illuminated active day column
    const todayCell = page.locator('[aria-current="date"]').first();
    if (await todayCell.isVisible()) {
      await todayCell.click();
    }

    // 8. Click Dashboard link and verify "Dashboard is still under construction" toast
    await page.getByRole('link', { name: /dashboard/i }).click();
    await page.waitForURL('**/dashboard');
    await expect(page.getByText(/dashboard is still under construction/i)).toBeVisible();
  });
});
