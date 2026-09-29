import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const SHOTS = 'docs/assets/screenshots';

async function noSeriousA11yIssues(page: import('@playwright/test').Page) {
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  const serious = r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
  expect(serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
}

test.describe('desktop', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop only');

  test('primary demo journey (brief §32)', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const t0 = Date.now();
    await page.goto('/');
    // See Situation Inbox
    await expect(page.getByRole('heading', { level: 1, name: '6 things need your attention' })).toBeVisible();
    expect(Date.now() - t0).toBeLessThan(3000);
    await page.screenshot({ path: `${SHOTS}/01-inbox.png` });

    // Open conflict → view evidence → understand explanation
    await page.getByRole('link', { name: /Acme interview: date conflict/ }).click();
    const detail = page.getByRole('article');
    await detail.getByRole('link', { name: 'Why am I seeing this?' }).click();
    await expect(detail.getByText('Version A')).toBeVisible();
    await expect(detail.locator('mark.evidence-mark')).toHaveCount(3);
    await noSeriousA11yIssues(page);

    // Resolve
    await detail.getByRole('button', { name: 'Choose the correct version' }).click();
    const dialog = page.getByRole('dialog', { name: 'Which version is correct?' });
    await dialog.getByRole('radio', { name: /Mon 5 Oct, 11:00/ }).check();
    await page.screenshot({ path: `${SHOTS}/02-resolve-conflict.png` });
    await dialog.getByRole('button', { name: 'Save answer' }).click();
    await expect(detail.getByText('You confirmed Mon 5 Oct, 11:00 is correct.')).toBeVisible();

    // Open change → before/after
    await page.getByRole('link', { name: /Flight KS 2134 now departs 10:30/ }).click();
    await expect(page.getByRole('table', { name: 'Before and after' })).toBeVisible();
    await expect(page.getByText('May be affected', { exact: true })).toBeVisible();
    await page.screenshot({ path: `${SHOTS}/03-change.png`, fullPage: true });

    // Open commitment → see source → mark resolved
    await page.getByRole('link', { name: /Revised proposal due today/ }).click();
    await page.screenshot({ path: `${SHOTS}/04-commitment.png` });
    await page.getByRole('link', { name: 'Open full email' }).click();
    await expect(page.getByText("I'll send the revised proposal by Thursday", { exact: false }).first()).toBeVisible();
    await page.goBack();
    await page.getByRole('button', { name: 'Mark as resolved' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Marked as resolved' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 1, name: '4 things need your attention' })).toBeVisible();

    expect(errors).toEqual([]);
  });

  test('evidence for a missing document and the injection flag', async ({ page }) => {
    await page.goto('/#/inbox/commitments');
    await page.getByRole('link', { name: /Signed NDA not found/ }).click();
    await expect(page.getByText('Closest match Nexus found')).toBeVisible();
    await expect(page.getByText(/Where Nexus looked/)).toBeVisible();
    await page.screenshot({ path: `${SHOTS}/05-missing-document.png` });

    await page.goto('/#/sources?open=em-injection');
    await expect(page.getByText(/Contains text addressed to AI assistants/)).toBeVisible();
    await page.screenshot({ path: `${SHOTS}/06-sources-injection-flag.png` });
    await noSeriousA11yIssues(page);
  });

  test('uncertain match is labelled Possible and offers "different events"', async ({ page }) => {
    await page.goto('/#/inbox/conflicts');
    await page.getByRole('link', { name: /Call with Priya/ }).click();
    await expect(page.getByRole('article').getByText('Possible', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Choose the correct version' }).click();
    await expect(page.getByRole('radio', { name: /These are different events/ })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
  });

  test('other pages pass accessibility checks, including dark mode', async ({ page }) => {
    for (const path of ['/#/about', '/#/activity', '/#/inbox/resolved']) {
      await page.goto(path);
      await page.waitForTimeout(200);
      await noSeriousA11yIssues(page);
    }
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/#/inbox/needs_attention');
    await page.waitForTimeout(300);
    await noSeriousA11yIssues(page);
    await page.screenshot({ path: `${SHOTS}/07-dark.png` });
  });

  test('keyboard only: tab to a situation and open it', async ({ page }) => {
    await page.goto('/#/inbox/waiting');
    await page.getByRole('link', { name: /Waiting on panel names/ }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { level: 2, name: /Waiting on panel names/ })).toBeVisible();
  });
});

test.describe('mobile', () => {
  test.skip(({ isMobile }) => !isMobile, 'mobile only');

  test('list → detail → back, no horizontal scroll, accessible', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1, name: '6 things need your attention' })).toBeVisible();
    await page.screenshot({ path: `${SHOTS}/08-mobile-inbox.png` });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await noSeriousA11yIssues(page);

    await page.getByRole('link', { name: /Acme interview: date conflict/ }).click();
    await expect(page.getByRole('heading', { level: 2, name: 'Acme interview: date conflict' })).toBeVisible();
    await page.screenshot({ path: `${SHOTS}/09-mobile-conflict.png`, fullPage: true });
    await noSeriousA11yIssues(page);
    await page.getByRole('link', { name: 'Back to list' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});
