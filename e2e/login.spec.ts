import { test, expect } from '@playwright/test';

test('has title and login elements', async ({ page }) => {
    await page.goto('/login');

    // Expect a title "to contain" a substring.
    await expect(page).toHaveTitle(/KikanCloud/);

    // Expect the login heading to be visible
    await expect(page.locator('h1', { hasText: 'KikanCloud' })).toBeVisible();

    // Expect email input
    await expect(page.locator('input[type="email"]')).toBeVisible();

    // Expect password input
    await expect(page.locator('input[type="password"]')).toBeVisible();

    // Expect submit button
    await expect(page.locator('button[type="submit"]')).toBeVisible();
});
