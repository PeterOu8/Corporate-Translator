import { expect, test } from '@playwright/test';

const source = 'I finished my homework.';
const result =
  'Operationalized the delivery of my academic action items, closing the loop on a knowledge activation initiative. Humbled to align intellectual bandwidth with assignment-level execution. The learning ecosystem never clocks out.';

test.beforeEach(async ({ page }) => {
  // Every browser request is mocked: no credentials, quota use or provider flakiness.
  await page.route('**/api/translate', (route) =>
    route.fulfill({ json: { result } }),
  );
  await page.goto('/');
});

test('validates, accepts Shift+Enter, and submits with Enter', async ({
  page,
}) => {
  const input = page.getByRole('textbox', { name: 'English', exact: true });
  const submit = page.getByRole('button', { name: 'Translate', exact: true });
  await expect(submit).toBeDisabled();
  await input.fill('x'.repeat(501));
  await expect(page.getByRole('main').getByRole('alert')).toContainText(
    'Maximum 500 characters',
  );
  await expect(submit).toBeDisabled();
  await input.fill(source);
  await input.press('Shift+Enter');
  await expect(input).toHaveValue(`${source}\n`);
  const request = page.waitForRequest('**/api/translate');
  await input.press('Enter');
  expect((await request).postDataJSON().text).toBe(source);
  await expect(page.getByText(result, { exact: true })).toBeVisible();
});

test('sends selected personality and intensity', async ({ page }) => {
  await page.getByRole('textbox').fill(source);
  await page.getByRole('button', { name: 'Personality: Professional' }).click();
  await page.getByRole('button', { name: /Startup Founder Big ideas/ }).click();
  await expect(
    page.getByRole('button', { name: 'Personality: Startup Founder' }),
  ).toBeFocused();
  await page.getByRole('slider').press('ArrowRight');
  const request = page.waitForRequest('**/api/translate');
  await page.getByRole('button', { name: 'Translate', exact: true }).click();
  expect((await request).postDataJSON()).toMatchObject({
    style: 'startup founder',
    intensity: 4,
  });
});

test('regenerates, swaps the output into input, and clears', async ({
  page,
}) => {
  await page.getByRole('textbox').fill(source);
  await page.getByRole('button', { name: 'Translate', exact: true }).click();
  await expect(page.getByText(result, { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Regenerate translation' }).click();
  await expect(
    page.getByRole('button', { name: 'Translate', exact: true }),
  ).toBeEnabled();
  await page.getByRole('button', { name: /Swap direction/ }).click();
  await expect(
    page.getByRole('textbox', { name: 'LinkedIn Jargon', exact: true }),
  ).toHaveValue(result);
  const request = page.waitForRequest('**/api/translate');
  await page.getByRole('button', { name: 'Translate', exact: true }).click();
  expect((await request).postDataJSON().mode).toBe('reverse');
  await expect(
    page.getByRole('button', { name: 'Translate', exact: true }),
  ).toBeEnabled();
  await page.getByRole('button', { name: 'Clear translation' }).click();
  await expect(page.getByRole('textbox')).toHaveValue('');
  await expect(page.getByText(result, { exact: true })).toHaveCount(0);
  await expect(page.getByRole('textbox')).toBeFocused();
});

test('keeps input and prior result on firewall rejection, then retries', async ({
  page,
}) => {
  await page.getByRole('textbox').fill(source);
  await page.getByRole('button', { name: 'Translate', exact: true }).click();
  await expect(page.getByText(result, { exact: true })).toBeVisible();
  await page.route('**/api/translate', (route) =>
    route.fulfill({ status: 429, contentType: 'text/html', body: 'Blocked' }),
  );
  await page.getByRole('button', { name: 'Regenerate translation' }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText(
    'Too many requests',
  );
  await expect(page.getByRole('textbox')).toHaveValue(source);
  await expect(page.getByText(result, { exact: true })).toBeVisible();
  await page.route('**/api/translate', (route) =>
    route.fulfill({ json: { result: 'Retried translation.' } }),
  );
  await page.getByRole('button', { name: 'Retry translation' }).click();
  await expect(
    page.getByText('Retried translation.', { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('main').getByRole('alert')).toHaveCount(0);
});

test('prevents duplicate requests and cancels safely', async ({ page }) => {
  let requests = 0;
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/api/translate', async (route) => {
    requests++;
    await pending;
    await route.fulfill({ json: { result } }).catch(() => {});
  });
  await page.getByRole('textbox').fill(source);
  await page.getByRole('textbox').press('Enter');
  await expect(
    page.getByRole('button', { name: 'Translating…', exact: true }),
  ).toBeDisabled();
  await expect(page.getByRole('slider')).toBeDisabled();
  await expect(page.getByRole('textbox')).toBeDisabled();
  await page.locator('form').dispatchEvent('submit');
  await expect(
    page.getByRole('button', { name: 'Translating…', exact: true }),
  ).toBeDisabled();
  await page.getByRole('button', { name: 'Cancel translation' }).click();
  release();
  await expect(
    page.getByRole('button', { name: 'Translate', exact: true }),
  ).toBeEnabled();
  await expect(page.getByRole('textbox')).toHaveValue(source);
  await expect(page.getByText(result, { exact: true })).toHaveCount(0);
  expect(requests).toBe(1);
});

test('copies results and reports clipboard failure', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByRole('textbox').fill(source);
  await page.getByRole('button', { name: 'Translate', exact: true }).click();
  await page.getByRole('button', { name: 'Copy translation' }).click();
  await expect(page.getByText('Copied!', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    result,
  );
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: () => Promise.reject(new Error('Denied')) },
    });
  });
  await page.getByRole('button', { name: 'Copy translation' }).click();
  await expect(page.getByText(/Could not copy/)).toBeVisible();
});

test('handles malformed provider responses and network failures', async ({
  page,
}) => {
  await page.getByRole('textbox').fill(source);
  await page.route('**/api/translate', (route) =>
    route.fulfill({ json: { result: '' } }),
  );
  await page.getByRole('button', { name: 'Translate', exact: true }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText(
    'invalid translation',
  );
  await page.route('**/api/translate', (route) => route.abort());
  await page.getByRole('button', { name: 'Retry translation' }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText(
    'Check your connection',
  );
});

test('responsive layout and README screenshots', async ({ page }, testInfo) => {
  await page.getByRole('textbox').fill(source);
  await page.getByRole('button', { name: 'Translate', exact: true }).click();
  await expect(page.getByText(result, { exact: true })).toBeVisible();
  const input = await page
    .getByRole('region', { name: 'English', exact: true })
    .boundingBox();
  const output = await page
    .getByRole('region', { name: 'LinkedIn Jargon', exact: true })
    .boundingBox();
  if (testInfo.project.name === 'mobile')
    expect(output!.y).toBeGreaterThan(input!.y + input!.height);
  else expect(output!.y).toBe(input!.y);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  if (process.env.UPDATE_SCREENSHOTS === '1') {
    await page.screenshot({
      path: `docs/screenshots/${testInfo.project.name}.png`,
      fullPage: true,
      animations: 'disabled',
    });
  }
});
