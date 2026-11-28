import { test, expect } from '@playwright/test';

test.describe('Sprint 2 Participant Customization, Quick-View, Dashboard & Stats (E2E-S2-01)', () => {
  const uniqueEmail = `playwright.s2.f7.${Date.now()}@example.com`;
  const password = 'SecurePassword123!';

  test('E2E-S2-01: Participant creates habit with color/category -> Quick-View -> Dashboard -> Habits Directory & Stats', async ({ page }) => {
    // 1. Register Participant
    await page.goto('/register');
    await page.getByLabel(/full name/i).fill('Sprint2 Participant');
    await page.getByLabel(/email address/i).fill(uniqueEmail);
    await page.getByLabel(/^password/i).fill(password);
    await page.getByLabel(/participant/i).check();
    await page.getByRole('button', { name: /create account/i }).click();

    await page.waitForURL('**/calendar');

    // 2. Create Habit 1 with Sprint 1 palette color + preset category
    await page.getByRole('button', { name: /\+ new habit/i }).first().click();
    const createDialog = page.getByRole('dialog', { name: '+ Create New Habit' });
    await expect(createDialog).toBeVisible();
    await createDialog.getByLabel(/habit name/i).fill('Morning Meditation');
    await createDialog.getByLabel(/^category/i).selectOption('Mindfulness');
    await createDialog.getByRole('radio', { name: 'Verdigris' }).click();
    await createDialog.getByRole('button', { name: /save habit/i }).click();
    await expect(page.getByText('Morning Meditation')).toBeVisible();

    // 3. Create Habit 2 with Custom category for Quick-View Back/Edit/Delete check
    await page.getByRole('button', { name: /\+ new habit/i }).first().click();
    await expect(createDialog).toBeVisible();
    await createDialog.getByLabel(/habit name/i).fill('Evening Walk');
    await createDialog.getByLabel(/^category/i).selectOption('__CUSTOM__');
    const customCategoryInput = createDialog.getByLabel('Custom category');
    await expect(customCategoryInput).toBeVisible();
    await customCategoryInput.fill('Outdoor Cardio');
    await createDialog.getByRole('button', { name: /save habit/i }).click();
    await expect(page.getByText('Evening Walk')).toBeVisible();

    // 4. Inspect Quick-View Card: Back, Edit transition, and Delete soft-archive
    await page.getByRole('button', { name: /View Evening Walk details/i }).click();
    const quickViewDialog = page.getByRole('dialog', { name: 'Evening Walk' });
    await expect(quickViewDialog).toBeVisible();
    await expect(quickViewDialog.getByText('Outdoor Cardio')).toBeVisible();
    await quickViewDialog.getByRole('button', { name: 'Back', exact: true }).click();
    await expect(quickViewDialog).not.toBeVisible();

    await page.getByRole('button', { name: /View Evening Walk details/i }).click();
    await quickViewDialog.getByRole('button', { name: 'Edit', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Edit Habit' })).toBeVisible();
    await page.getByRole('button', { name: 'Cancel', exact: true }).click();

    await page.getByRole('button', { name: /View Evening Walk details/i }).click();
    await quickViewDialog.getByRole('button', { name: 'Delete', exact: true }).click();
    await quickViewDialog.getByRole('button', { name: 'Confirm Delete', exact: true }).click();
    await expect(quickViewDialog).not.toBeVisible();
    await expect(page.getByRole('button', { name: /View Evening Walk details/i })).not.toBeVisible();

    // 5. Navigate to Dashboard (/dashboard), verify Today's Focus + Weekly Progress, and toggle completion
    await page.getByRole('link', { name: 'Dashboard' }).click();
    await page.waitForURL('**/dashboard');
    await expect(page.getByRole('heading', { name: 'Participant Dashboard' })).toBeVisible();
    await expect(page.getByText('Morning Meditation').first()).toBeVisible();

    const toggleCheckbox = page.getByLabel(/Mark Morning Meditation as completed/i);
    await toggleCheckbox.click();
    await expect(page.getByText('1 / 1 completed')).toBeVisible();
    await expect(
      page.getByRole('region', { name: 'Weekly Habit Progress' }).getByText(/1 \/ [1-7] \(\d+%\)/)
    ).toBeVisible();

    // 6. Navigate to All Habits Directory (/habits) and inspect Stats + Month/Year Heatmap
    await page.getByRole('link', { name: 'Habits' }).click();
    await page.waitForURL('**/habits');
    await expect(page.getByRole('heading', { name: 'All Habits' })).toBeVisible();
    await expect(page.getByRole('list', { name: 'All habits list' })).toBeVisible();
    await expect(page.getByText('Evening Walk')).not.toBeVisible();

    await page.getByRole('link', { name: 'View Stats' }).first().click();
    await page.waitForURL('**/habits/*/stats');

    await expect(page.getByRole('heading', { name: 'Morning Meditation' })).toBeVisible();
    await expect(page.getByTestId('current-streak-value')).toHaveText('1 day');
    await expect(page.getByTestId('highest-streak-value')).toHaveText('1 day');
    await expect(page.getByRole('grid', { name: 'Monthly completion heatmap' })).toBeVisible();

    await page.getByRole('button', { name: 'Year' }).click();
    await expect(page.getByRole('grid', { name: 'Yearly completion heatmap' })).toBeVisible();
    await expect(page.getByLabel('Year heatmap month headers')).toBeVisible();
    await expect(page.getByLabel('Heatmap legend')).toBeVisible();
  });
});
