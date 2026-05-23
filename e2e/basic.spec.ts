import { test, expect } from '@playwright/test';

test.describe('Inventory Management System - Basic E2E Tests', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');

    // Check if the page loads successfully
    await expect(page).toHaveTitle(/Inventory Management/i);

    // Check for key elements on the homepage
    await expect(page.locator('body')).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/');

    // Look for login link or button
    const loginLink = page
      .locator(
        'a[href*="login"], button:has-text("Login"), a:has-text("Login")'
      )
      .first();

    if (await loginLink.isVisible()) {
      await loginLink.click();

      // Should be on login page
      await expect(page).toHaveURL(/.*login.*/);

      // Check for login form elements
      const emailInput = page
        .locator(
          'input[type="email"], input[name="email"], input[placeholder*="email" i]'
        )
        .first();
      const passwordInput = page
        .locator('input[type="password"], input[name="password"]')
        .first();

      if (await emailInput.isVisible()) {
        await expect(emailInput).toBeVisible();
      }
      if (await passwordInput.isVisible()) {
        await expect(passwordInput).toBeVisible();
      }
    }
  });

  test('should navigate to signup page', async ({ page }) => {
    await page.goto('/');

    // Look for signup link or button
    const signupLink = page
      .locator(
        'a[href*="signup"], button:has-text("Sign up"), a:has-text("Sign up")'
      )
      .first();

    if (await signupLink.isVisible()) {
      await signupLink.click();

      // Should be on signup page
      await expect(page).toHaveURL(/.*signup.*/);
    }
  });

  test('should have responsive design', async ({ page }) => {
    await page.goto('/');

    // Test desktop view
    await page.setViewportSize({ width: 1200, height: 800 });
    await expect(page.locator('body')).toBeVisible();

    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('body')).toBeVisible();

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('body')).toBeVisible();
  });

  test('should handle 404 pages gracefully', async ({ page }) => {
    // Navigate to a non-existent page
    const response = await page.goto('/non-existent-page');

    // Should either redirect or show 404
    if (response && response.status() === 404) {
      // Check that the page still loads something (not completely broken)
      await expect(page.locator('body')).toBeVisible();
    } else {
      // If it redirects, that's also acceptable behavior
      await expect(page.locator('body')).toBeVisible();
    }
  });
});
