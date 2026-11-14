import { test, expect } from '@playwright/test';

test.describe('Feature 4: Program Manager Challenge Lifecycle & Participant Join (E2E-03)', () => {
  const managerEmail = `mgr.e2e.${Date.now()}@habitless.test`;
  const participantEmail = `part.e2e.${Date.now()}@habitless.test`;
  const password = 'SecurePassword123!';

  test('E2E-03: Full Program Manager Lifecycle & Participant Join Journey', async ({ page, context }) => {
    // 1. Register as a Program Manager
    await page.goto('/register');
    await page.getByLabel(/full name/i).fill('Dr. Taylor Challenge PM');
    await page.getByLabel(/email address/i).fill(managerEmail);
    await page.getByLabel(/^password/i).fill(password);
    await page.getByLabel(/program manager/i).check();
    await page.getByRole('button', { name: /create account/i }).click();

    // 2. Verified post-auth navigation to /manager
    await page.waitForURL('**/manager');
    await expect(page.getByRole('heading', { name: 'Challenge Programs' })).toBeVisible();

    // 3. Open Challenge Builder Modal
    await page.getByRole('button', { name: /\+ create challenge/i }).first().click();
    await expect(page.getByText('Create a New Challenge')).toBeVisible();

    // 4. Fill in Challenge Builder Form
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');

    await page.getByLabel(/program title/i).fill('30-Day Total Wellness');
    await page.getByLabel(/category/i).selectOption('Wellness');
    await page.getByLabel(/start date/i).fill(`${currentYear}-${currentMonth}-01`);
    await page.getByLabel(/end date/i).fill(`${currentYear}-${currentMonth}-28`);

    // Fill in Activity 1
    await page.getByLabel(/activity 1 title/i).fill('Daily Hydration (2L)');

    // Add Activity 2
    await page.getByRole('button', { name: /\+ add activity/i }).click();
    await page.getByLabel(/activity 2 title/i).fill('30 min Cardio Walk');
    // Configure Activity 2 schedule by toggling days of week (keep Saturday active for today)
    const mondayBtn = page.getByRole('checkbox', { name: 'Monday' }).nth(1);
    const wednesdayBtn = page.getByRole('checkbox', { name: 'Wednesday' }).nth(1);
    await mondayBtn.click();
    await wednesdayBtn.click();

    // 4. Save Draft
    await page.getByRole('button', { name: /save as draft/i }).click();
    await expect(page.getByText('30-Day Total Wellness')).toBeVisible();
    await expect(page.getByText('DRAFT', { exact: true })).toBeVisible();

    // 5. Deploy / Publish to Web from draft row
    const publishBtn = page.getByRole('button', { name: /^publish$/i }).first();
    await publishBtn.click();
    // Confirm publish in dialog
    await page.getByRole('button', { name: /publish to web/i }).click();

    // 6. Verify status transitions to PUBLISHED and invite link is displayed
    await expect(page.getByText('PUBLISHED', { exact: true })).toBeVisible();
    const linkElement = page.locator('code', { hasText: '/challenges/' });
    await expect(linkElement).toBeVisible();
    const invitePath = await linkElement.textContent();
    expect(invitePath).toContain('/challenges/');

    // 7. Clear cookies / Sign out
    await page.getByRole('button', { name: /log out/i }).click();
    await page.waitForURL('**/login');

    // 8. Register a new participant to join the challenge
    await page.goto('/register');
    await page.getByLabel(/full name/i).fill('Sam Participant');
    await page.getByLabel(/email address/i).fill(participantEmail);
    await page.getByLabel(/^password/i).fill(password);
    await page.getByLabel(/participant/i).check();
    await page.getByRole('button', { name: /create account/i }).click();
    await page.waitForURL('**/calendar');

    // 9. Navigate directly to the challenge invitation link
    await page.goto(invitePath!.trim());

    // Verify challenge details on public invitation landing card
    await expect(page.getByRole('heading', { level: 1, name: '30-Day Total Wellness' })).toBeVisible();
    await expect(page.getByText('Dr. Taylor Challenge PM')).toBeVisible();
    await expect(page.getByText('Daily Hydration (2L)')).toBeVisible();
    await expect(page.getByText('30 min Cardio Walk')).toBeVisible();

    // 10. Participant clicks Join Challenge Now
    const joinBtn = page.getByRole('button', { name: /join challenge now/i });
    await expect(joinBtn).toBeVisible();
    await joinBtn.click();

    // 11. Verify enrollment confirmation and button transition
    await expect(page.getByRole('button', { name: /enrolled ✓/i })).toBeVisible();
    await expect(page.getByText(/curriculum habits have been added to your habit calendar/i)).toBeVisible();

    // 12. Navigate to /calendar and verify materialized curriculum habits
    await page.getByRole('button', { name: /go to habit calendar/i }).click();
    await page.waitForURL('**/calendar');

    await expect(page.getByText('Daily Hydration (2L)')).toBeVisible();
    await expect(page.getByText('30 min Cardio Walk')).toBeVisible();
  });
});
