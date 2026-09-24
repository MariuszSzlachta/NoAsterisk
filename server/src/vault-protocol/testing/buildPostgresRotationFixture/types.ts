import type { VaultSignatureFixture } from '@vault-protocol/testing/build-vault-signature-fixture/types';
import type { PostgresRecoveryFixture } from '@vault-protocol/testing/build-postgres-recovery-fixture/types';
import type { PrepareDualRootRotationRequest } from '@vault-protocol/domain/ports/dual-root-rotation';
export interface PostgresRotationFixture extends PostgresRecoveryFixture {
  readonly nextSignature: VaultSignatureFixture;
  readonly request: PrepareDualRootRotationRequest;
}
