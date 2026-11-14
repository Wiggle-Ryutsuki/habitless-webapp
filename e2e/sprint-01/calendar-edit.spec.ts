import { test, expect } from '@playwright/test';

test.describe('Feature 3: Calendar Desktop Matrix, In-Calendar Edit & Notes (E2E-02)', () => {
  const uniqueEmail = `playwright.cal.${Date.now()}@example.com`;
  const password = 'SecurePassword123!';

  test('E2E-02: Complete In-Calendar Tracking, Editing, and Reflection Notes Journey', async ({ page }) => {
    // 1. Register a participant
    await page.goto('/register');
    await page.getByLabel(/full name/i).fill('Alex Calendar Tester');
    await page.getByLabel(/email address/i).fill(uniqueEmail);
    await page.getByLabel(/^password/i).fill(password);
    await page.getByLabel(/participant/i).check();
    await page.getByRole('button', { name: /create account/i }).click();

    // 2. Lands on /calendar
    await page.waitForURL('**/calendar');
    await expect(page.getByRole('heading', { level: 2, name: /202/i })).toBeVisible();

    // 3. Create a habit via + New Habit
    await page.getByRole('button', { name: /\+ new habit/i }).first().click();
    await page.getByLabel(/habit name/i).fill('Morning Yoga');
    await page.getByLabel(/target count/i).fill('20');
    await page.getByRole('button', { name: /save habit/i }).click();

    // 4. Verify habit appears in calendar matrix row
    await expect(page.getByText('Morning Yoga')).toBeVisible();

    // 5. Click Day 1 cell in the matrix
    const day1Cell = page.getByLabel(/Morning Yoga, Day 1: Not completed/i);
    await day1Cell.click();
    await expect(page.getByLabel(/Morning Yoga, Day 1: Completed/i)).toBeVisible();

    // 6. Click Edit button on the habit row
    await page.getByLabel(/Edit Morning Yoga/i).click();
    await expect(page.getByRole('dialog', { name: /edit habit/i })).toBeVisible();

    // 7. Update title and target count
    const titleInput = page.getByLabel(/habit name/i);
    await titleInput.fill('Power Yoga Routine');
    const targetInput = page.getByLabel(/target count/i);
    await targetInput.fill('22');
    await page.getByRole('button', { name: /save changes/i }).click();

    // 8. Verify row immediately reflects new title and target count
    await expect(page.getByText('Power Yoga Routine')).toBeVisible();
    await expect(page.locator('tbody').getByText('22')).toBeVisible();

    // 9. Post a reflection note in the Notes section below
    await page.getByRole('button', { name: /\+ new note/i }).click();
    const noteTextarea = page.getByLabel(/reflection/i);
    await noteTextarea.fill('Felt energetic and focused throughout the morning session.');
    await page.getByRole('button', { name: /post note/i }).click();

    // 10. Verify reflection card appears in feed
    await expect(page.getByText('Felt energetic and focused throughout the morning session.')).toBeVisible();
  });
});

