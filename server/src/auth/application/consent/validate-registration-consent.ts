import { DomainError } from '@budget/domain';
import { REGISTRATION_CONSENT } from '@auth/application/consent/registration-consent';

export const validateRegistrationConsent = (
  privacyPolicyVersion: string,
  termsVersion: string,
): void => {
  const isCurrentVersion =
    privacyPolicyVersion === REGISTRATION_CONSENT.privacyPolicyVersion &&
    termsVersion === REGISTRATION_CONSENT.termsVersion;

  if (!isCurrentVersion) {
    throw new DomainError('Registration consent is required');
  }
};
