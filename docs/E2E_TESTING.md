# E2E Testing Guide

This guide explains how to run End-to-End (E2E) tests for the Inventory Management System.

## Prerequisites

1. **Install Playwright browsers** (first time only):

   ```bash
   npx playwright install
   ```

2. **Environment Setup**:
   - Copy `.env.local.example` to `.env.local`
   - Configure your Supabase credentials in `.env.local`

## Running E2E Tests Locally

### Option 1: Manual Server + Tests (Recommended for Development)

1. **Start the development server** on port 3001:

   ```bash
   npm run dev -- --port 3001
   ```

   Wait for the server to be ready (you should see "Ready - started server on 0.0.0.0:3001")

2. **In a separate terminal**, run the E2E tests:
   ```bash
   npm run test:e2e
   ```

### Option 2: Automatic Server Management

Run tests with automatic server startup/shutdown:

```bash
npm run test:e2e
```

This will:

- Automatically start the dev server on port 3001
- Run all E2E tests
- Shut down the server when done

## Test Configuration

The E2E tests are configured in `playwright.config.ts`:

- **Base URL**: `http://localhost:3001`
- **Test Directory**: `./e2e/`
- **Browsers**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Parallel Execution**: Enabled for faster testing

## Available Test Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run tests in a specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run a specific test file
npx playwright test e2e/basic.spec.ts

# Run tests in debug mode
npx playwright test --debug

# Generate test report
npx playwright show-report
```

## Test Structure

Current E2E tests include:

### Basic Tests (`basic.spec.ts`)

- **Homepage Loading**: Basic page loading and responsiveness
- **Navigation**: Login/signup page navigation
- **Error Handling**: 404 page behavior
- **Responsive Design**: Testing across different viewport sizes

### Authentication Flow Tests (`auth-flow.spec.ts`)

- **Authentication Redirect**: Verifies unauthenticated users are redirected to login
- **Login Page Structure**: Tests login form elements and interactions
- **Signup/Reset Pages**: Verifies accessibility of auth-related pages
- **Responsive Auth**: Tests authentication pages across different screen sizes

### Inventory Feature Tests (`inventory.spec.ts`)

- **Content Detection**: Looks for inventory-related content (handles auth redirect)
- **Navigation Elements**: Tests for Material-UI AppBar/Toolbar navigation
- **Form Interactions**: Tests inventory management forms when present
- **Accessibility**: Basic accessibility compliance checks
- **Authentication Awareness**: Adapts tests based on authentication state

## Authentication in E2E Tests

The application uses authentication middleware that redirects unauthenticated users to `/login`. E2E tests are designed to handle this:

- **Unauthenticated Tests**: Test the login flow and public pages
- **Authenticated Tests**: Would require login credentials (not included for security)
- **Adaptive Tests**: Tests that work whether user is authenticated or not

### Testing with Authentication

For testing authenticated features, you would need to:

1. **Set up test credentials** in your Supabase project
2. **Create a login helper** function for tests
3. **Use test-specific environment variables**

Example login helper (not implemented for security):

```typescript
// e2e/helpers/auth.ts
export async function loginTestUser(page: Page) {
  await page.goto('/login');
  await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL!);
  await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD!);
  await page.click('button[type="submit"]');
  await page.waitForURL('/'); // Wait for redirect to dashboard
}
```

## Writing New Tests

Create new test files in the `e2e/` directory:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/');
    // Your test code here
  });
});
```

## Debugging Tests

1. **Visual Debugging**:

   ```bash
   npx playwright test --headed --slowMo=1000
   ```

2. **Debug Mode**:

   ```bash
   npx playwright test --debug
   ```

3. **Screenshots on Failure**:
   Screenshots are automatically captured on test failures and saved to `test-results/`

4. **Trace Viewer**:
   ```bash
   npx playwright show-trace test-results/[test-name]/trace.zip
   ```

## CI/CD Integration

E2E tests run automatically in GitHub Actions:

- Tests run on Ubuntu with Chromium browser
- Server starts automatically on port 3001
- Test results and artifacts are uploaded on failure

## Troubleshooting

### Common Issues

1. **Port 3001 already in use**:

   ```bash
   lsof -ti:3001 | xargs kill -9
   ```

2. **Playwright browsers not installed**:

   ```bash
   npx playwright install
   ```

3. **Environment variables missing**:
   - Ensure `.env.local` exists with proper Supabase credentials
   - Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set

4. **Tests timing out**:
   - Increase timeout in `playwright.config.ts`
   - Check if server is running on correct port
   - Verify network connectivity

### Performance Tips

- Use `page.waitForLoadState('networkidle')` for dynamic content
- Implement proper selectors (data-testid attributes)
- Use `page.locator()` instead of deprecated methods
- Group related tests in describe blocks

## Best Practices

1. **Use data-testid attributes** for reliable element selection
2. **Wait for elements** before interacting with them
3. **Test user journeys** rather than individual components
4. **Keep tests independent** - each test should be able to run in isolation
5. **Use meaningful test descriptions** that explain the expected behavior
