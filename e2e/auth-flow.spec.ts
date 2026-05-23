import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/');

    // Should be redirected to login page
    await expect(page).toHaveURL(/.*login.*/);

    // Should have login form elements
    await expect(
      page.locator('input[type="email"], input[name="email"]').first()
    ).toBeVisible();
    await expect(
      page.locator('input[type="password"], input[name="password"]').first()
    ).toBeVisible();
  });

  test('should have proper login page structure', async ({ page }) => {
    await page.goto('/login');

    // Check for essential login elements
    const emailInput = page
      .locator('input[type="email"], input[name="email"]')
      .first();
    const passwordInput = page
      .locator('input[type="password"], input[name="password"]')
      .first();
    const loginButton = page
      .locator(
        'button:has-text("Login"), button:has-text("Sign in"), input[type="submit"]'
      )
      .first();

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(loginButton).toBeVisible();

    // Test form interaction
    await emailInput.fill('test@example.com');
    await expect(emailInput).toHaveValue('test@example.com');

    await passwordInput.fill('testpassword');
    await expect(passwordInput).toHaveValue('testpassword');
  });

  test('should have signup page accessible', async ({ page }) => {
    await page.goto('/signup');

    // Should load signup page without errors
    await expect(page.locator('body')).toBeVisible();

    // Look for signup-specific elements
    const signupElements = await page
      .locator('text=/sign up|create account|register/i')
      .count();
    expect(signupElements).toBeGreaterThan(0);
  });

  test('should handle password reset page', async ({ page }) => {
    await page.goto('/reset-password');

    // Should load password reset page without errors
    await expect(page.locator('body')).toBeVisible();

    // Look for password reset elements
    const resetElements = await page
      .locator('text=/reset|forgot|password/i')
      .count();
    expect(resetElements).toBeGreaterThan(0);
  });

  test('should have proper page titles and metadata', async ({ page }) => {
    await page.goto('/login');

    // Check page title
    await expect(page).toHaveTitle(/Inventory Management/i);

    // Check for favicon
    const favicon = page.locator('link[rel="icon"]');
    expect(await favicon.count()).toBeGreaterThan(0);
  });

  test('should be responsive on login page', async ({ page }) => {
    await page.goto('/login');

    // Test different viewport sizes
    const viewports = [
      { width: 1200, height: 800 }, // Desktop
      { width: 768, height: 1024 }, // Tablet
      { width: 375, height: 667 }, // Mobile
    ];

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);

      // Ensure login form is still visible and usable
      const emailInput = page
        .locator('input[type="email"], input[name="email"]')
        .first();
      const passwordInput = page
        .locator('input[type="password"], input[name="password"]')
        .first();

      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
    }
  });
});
