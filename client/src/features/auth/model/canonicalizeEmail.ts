/**
 * Canonicalizes email for API requests:
 * - Trims whitespace
 * - Converts to lowercase (aligned with backend email comparison)
 */
export const canonicalizeEmail = (email: string): string =>
  email.trim().toLowerCase();
