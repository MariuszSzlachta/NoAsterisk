import { ApiError } from '#shared/api';
import { isRecord } from '#features/auth/model/parse-auth-response/is-record';
import { EMAIL_CONFLICT_ERROR } from '#features/auth/api/useRegisterMutation/map-register-error/constants/email-conflict-error';
import { GENERIC_REGISTER_ERROR } from '#features/auth/api/useRegisterMutation/map-register-error/constants/generic-register-error';
import { HTTP_BAD_REQUEST } from '#features/auth/api/useRegisterMutation/map-register-error/constants/http-bad-request';
import { INVALID_INVITE_CODE_MESSAGE } from '#features/auth/api/useRegisterMutation/map-register-error/constants/invalid-invite-code-message';
import { INVALID_INVITE_ERROR } from '#features/auth/api/useRegisterMutation/map-register-error/constants/invalid-invite-error';
import { INVITE_CODE_REQUIRED_MESSAGE } from '#features/auth/api/useRegisterMutation/map-register-error/constants/invite-code-required-message';
import { REGISTRATION_FAILED_MESSAGE } from '#features/auth/api/useRegisterMutation/map-register-error/constants/registration-failed-message';
import { VALIDATION_FAILED_ERROR } from '#features/auth/api/useRegisterMutation/map-register-error/constants/validation-failed-error';
import { VALIDATION_FAILED_MESSAGE } from '#features/auth/api/useRegisterMutation/map-register-error/constants/validation-failed-message';

export const mapRegisterError = (err: unknown): string => {
  if (!(err instanceof ApiError)) {
    return GENERIC_REGISTER_ERROR;
  }

  if (err.status !== HTTP_BAD_REQUEST) {
    return GENERIC_REGISTER_ERROR;
  }

  if (!isRecord(err.body) || typeof err.body['message'] !== 'string') {
    return GENERIC_REGISTER_ERROR;
  }

  const message = err.body['message'];

  if (message === REGISTRATION_FAILED_MESSAGE) {
    return EMAIL_CONFLICT_ERROR;
  }

  if (message === INVITE_CODE_REQUIRED_MESSAGE || message === INVALID_INVITE_CODE_MESSAGE) {
    return INVALID_INVITE_ERROR;
  }

  if (message === VALIDATION_FAILED_MESSAGE) {
    return VALIDATION_FAILED_ERROR;
  }

  return GENERIC_REGISTER_ERROR;
};
