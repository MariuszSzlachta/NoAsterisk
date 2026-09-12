import { signedTrustedResponseSchema } from '#shared/adapters/vault-protocol/signed-trusted-enrollment/parse-response/schema';
import type { SignedTrustedResponse } from '#shared/adapters/vault-protocol/signed-trusted-enrollment/types';
import { trustedDeviceEnrollment } from '#shared/adapters/vault-protocol/trusted-device-enrollment';

export const parseSignedTrustedResponse = (
  value: unknown,
): SignedTrustedResponse => {
  const parsed = signedTrustedResponseSchema.safeParse(value);
  if (!parsed.success || parsed.data.intent.purpose !== 'trusted')
    throw new Error('Invalid trusted-device response');
  return {
    kind: parsed.data.kind,
    formatVersion: parsed.data.formatVersion,
    intent: parsed.data.intent,
    transferResponse: trustedDeviceEnrollment.parseResponse(
      parsed.data.transferResponse,
    ),
    delegationSignature: parsed.data.delegationSignature,
  };
};
