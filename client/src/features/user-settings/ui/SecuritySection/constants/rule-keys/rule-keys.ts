import type { PasswordValidationRules } from '#features/user-settings/model/types/password-validation-rules';

export const RULE_KEYS: ReadonlyArray<{ key: keyof PasswordValidationRules; i18nKey: string }> = [
  { key: 'minLength', i18nKey: 'settings.security.rules.minLength' },
  { key: 'hasUppercase', i18nKey: 'settings.security.rules.hasUppercase' },
  { key: 'hasLowercase', i18nKey: 'settings.security.rules.hasLowercase' },
  { key: 'hasDigit', i18nKey: 'settings.security.rules.hasDigit' },
  { key: 'hasSpecialChar', i18nKey: 'settings.security.rules.hasSpecialChar' },
  { key: 'differentFromCurrent', i18nKey: 'settings.security.rules.differentFromCurrent' },
  { key: 'confirmationMatch', i18nKey: 'settings.security.rules.confirmationMatch' },
];
