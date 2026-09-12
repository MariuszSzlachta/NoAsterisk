import type { RecoveryRegistrationScope } from '@vault-protocol/domain/recovery-registration/types';
import type { VaultSignatureFixture } from '@vault-protocol/testing/build-vault-signature-fixture';

export interface PostgresRecoveryFixture {
  readonly scope: RecoveryRegistrationScope;
  readonly keysetId: string;
  readonly deviceRowId: string;
  readonly signature: VaultSignatureFixture;
}
