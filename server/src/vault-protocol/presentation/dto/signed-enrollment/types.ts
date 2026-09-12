import type { z } from 'zod';
import type { prepareSignedEnrollmentSchema } from '@vault-protocol/presentation/dto/signed-enrollment/prepare-schema';
import type { finalizeSignedEnrollmentSchema } from '@vault-protocol/presentation/dto/signed-enrollment/finalize-schema';
import type { confirmSignedEnrollmentSchema } from '@vault-protocol/presentation/dto/signed-enrollment/confirm-schema';
export type PrepareSignedEnrollmentDto = z.infer<
  typeof prepareSignedEnrollmentSchema
>;
export type FinalizeSignedEnrollmentDto = z.infer<
  typeof finalizeSignedEnrollmentSchema
>;
export type ConfirmSignedEnrollmentDto = z.infer<
  typeof confirmSignedEnrollmentSchema
>;

interface PreparationResponseContext {
  readonly accountId: string;
  readonly workspaceId: string;
  readonly vaultId: string;
  readonly keyId: string;
  readonly deviceId: string;
  readonly signingPublicKey: string;
  readonly challenge: string;
  readonly createdAt: number;
  readonly expiresAt: number;
  readonly deviceEnvelope: string;
}
export interface PrepareSignedEnrollmentResponseDto {
  readonly serverShare: string;
  readonly intent: PreparationResponseContext &
    (
      | {
          readonly purpose: 'initial' | 'recovery';
          readonly recoveryPublicKey: string;
        }
      | {
          readonly purpose: 'trusted';
          readonly oldDeviceId: string;
          readonly newEphemeralPublicKey: string;
          readonly delegationDigest: string;
        }
    );
}
