import type { DrizzleDatabase } from '@shared/infrastructure/database/database.providers';
import type { RecoveryRegistrationScope } from '@vault-protocol/domain/recovery-registration/types';

export type RecoveryRegistrationTransaction = Parameters<
  Parameters<DrizzleDatabase['transaction']>[0]
>[0];

export interface RecoveryRegistrationAuthorityRow extends RecoveryRegistrationScope {
  readonly protocolVersion: string;
  readonly cryptoSuite: string;
  readonly keysetId: string;
  readonly signingPublicKey: string | null;
  readonly recoveryPublicKey: string | null;
  readonly deviceStatus: string;
  readonly isDeviceRevoked: boolean;
}
