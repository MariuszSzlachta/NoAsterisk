import { confirmSignedEnrollment } from '#shared/api/vault-protocol/signed-enrollment/confirm';
import { finalizeSignedEnrollment } from '#shared/api/vault-protocol/signed-enrollment/finalize';
import { prepareSignedEnrollment } from '#shared/api/vault-protocol/signed-enrollment/prepare';

export const vaultEnrollment = Object.freeze({
  prepare: prepareSignedEnrollment,
  finalize: finalizeSignedEnrollment,
  confirm: confirmSignedEnrollment,
});
