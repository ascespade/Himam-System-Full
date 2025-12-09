# Playwright Test Suite

Comprehensive end-to-end testing for Himam System.

## Test Structure

```
tests/
├── auth/              # Authentication tests
├── patient/           # Patient management tests
├── appointment/       # Appointment booking tests
├── doctor/           # Doctor workflow tests
├── business-logic/   # Business rule validation tests
├── integration/      # End-to-end user journey tests
├── helpers/          # Test utilities and helpers
├── fixtures/        # Test data fixtures
└── setup/           # Test environment setup
```

## Running Tests

```bash
# Run all tests
npm run test

# Run tests in UI mode
npm run test:ui

# Run tests in headed mode (see browser)
npm run test:headed

# Run specific test file
npm run test tests/auth/login.spec.ts

# Run tests in debug mode
npm run test:debug

# View test report
npm run test:report
```

## Test Coverage

### Authentication Tests
- Login page display
- Form validation
- Invalid credentials handling
- Successful login for all user roles
- Session persistence
- Protected route access
- Logout functionality

### Patient Management Tests
- Patient list display
- Create new patient
- Search patients
- View patient details
- Form validation
- Required field enforcement

### Appointment Booking Tests
- Appointment form display
- Date validation (no past dates)
- Patient selection
- Doctor selection
- Appointment creation

### Doctor Queue Tests
- Queue page display
- Queue items display
- Patient confirmation
- Navigation to current patient

### Business Logic Validation
- Phone number format validation
- Email format validation
- Date of birth validation
- Required fields enforcement
- Past appointment prevention

### End-to-End Tests
- Complete patient registration flow
- Appointment booking flow
- Doctor queue to patient view flow
- Dashboard navigation

## Test Data

Test users are configured in `tests/helpers/auth.ts`. Update environment variables or the test data file to use your test credentials:

```env
TEST_ADMIN_EMAIL=admin@himam.com
TEST_ADMIN_PASSWORD=admin123
TEST_DOCTOR_EMAIL=doctor@himam.com
TEST_DOCTOR_PASSWORD=doctor123
TEST_RECEPTION_EMAIL=reception@himam.com
TEST_RECEPTION_PASSWORD=reception123
```

## Writing New Tests

1. Create test file in appropriate directory
2. Import helpers from `tests/helpers/`
3. Use test data from `tests/fixtures/test-data.ts`
4. Follow existing test patterns
5. Use descriptive test names
6. Add appropriate assertions

Example:

```typescript
import { test, expect } from '@playwright/test'
import { loginAs, testUsers } from '../helpers/auth'

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await loginAs(page, testUsers.admin)
    // Test implementation
  })
})
```

## CI/CD Integration

Tests are configured to run in CI environments with:
- Automatic retries on failure
- Screenshot capture on failure
- Video recording on failure
- HTML test report generation
- JSON results export

## Troubleshooting

### Tests timing out
- Ensure dev server is running: `npm run dev`
- Check base URL in `playwright.config.ts`
- Increase timeout values if needed

### Authentication failures
- Verify test user credentials
- Check Supabase connection
- Ensure auth flow is working in manual testing

### Element not found errors
- Update selectors in `tests/helpers/selectors.ts`
- Check if UI has changed
- Use `page.pause()` for debugging
