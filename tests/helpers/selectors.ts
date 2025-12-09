/**
 * Test Selectors
 * Centralized selectors for consistent test maintenance
 */

export const selectors = {
  // Authentication
  login: {
    emailInput: 'input[name="email"]',
    passwordInput: 'input[name="password"]',
    submitButton: 'button[type="submit"]',
    errorMessage: '.text-red-500',
  },
  
  // Dashboard
  dashboard: {
    header: 'header, [role="banner"]',
    sidebar: 'nav, [role="navigation"], aside',
    mainContent: 'main, [role="main"]',
  },
  
  // Patient Management
  patient: {
    nameInput: 'input[name="name"], input[placeholder*="اسم"]',
    phoneInput: 'input[name="phone"], input[placeholder*="هاتف"]',
    emailInput: 'input[name="email"], input[type="email"]',
    saveButton: 'button:has-text("حفظ"), button:has-text("Save")',
    searchInput: 'input[placeholder*="بحث"], input[type="search"]',
    patientCard: '[data-testid="patient-card"], .patient-card',
    patientList: '[data-testid="patient-list"], .patient-list',
  },
  
  // Appointments
  appointment: {
    dateInput: 'input[type="date"], input[name="date"]',
    timeInput: 'input[type="time"], input[name="time"]',
    patientSelect: 'select[name="patient_id"], [data-testid="patient-select"]',
    doctorSelect: 'select[name="doctor_id"], [data-testid="doctor-select"]',
    createButton: 'button:has-text("حجز"), button:has-text("Book")',
    appointmentCard: '[data-testid="appointment-card"]',
  },
  
  // Queue
  queue: {
    queueItem: '[data-testid="queue-item"], .queue-item',
    confirmButton: 'button:has-text("تأكيد"), button:has-text("Confirm")',
    nextButton: 'button:has-text("التالي"), button:has-text("Next")',
  },
  
  // Common
  common: {
    loading: '[data-testid="loading"], .loading, .spinner',
    error: '[data-testid="error"], .error, .text-red-500',
    success: '[data-testid="success"], .success, .text-green-500',
    modal: '[role="dialog"], .modal',
    closeButton: 'button:has-text("إغلاق"), button:has-text("Close"), [aria-label="Close"]',
    saveButton: 'button:has-text("حفظ"), button:has-text("Save")',
    cancelButton: 'button:has-text("إلغاء"), button:has-text("Cancel")',
  },
}

/**
 * Wait for element with retry
 */
export async function waitForElement(
  page: any,
  selector: string,
  options: { timeout?: number; state?: 'visible' | 'attached' } = {}
): Promise<void> {
  const { timeout = 10000, state = 'visible' } = options
  await page.waitForSelector(selector, { state, timeout })
}
