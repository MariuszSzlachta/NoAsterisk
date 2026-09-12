import { Module } from '@nestjs/common';
import { AuthModule } from '@auth/auth.module';
import { TOKEN_PORT } from '@auth/domain/ports/token.port';
import { USER_REPOSITORY } from '@auth/domain/ports/user.repository';
import { IssueServerShareHandler } from '@vault-protocol/application/issue-server-share.handler';
import { SERVER_SHARE_REPOSITORY } from '@vault-protocol/domain/ports/server-share.repository';
import { InMemoryServerShareRepository } from '@vault-protocol/infrastructure/in-memory-server-share.repository';
import { PostgresServerShareRepository } from '@vault-protocol/infrastructure/postgres-server-share.repository';
import { WebauthnVerifierAdapter } from '@vault-protocol/infrastructure/webauthn-verifier.adapter';
import { WEBAUTHN_VERIFIER } from '@vault-protocol/domain/ports/webauthn-verifier.token';
import { PASSKEY_TOKEN_PORT } from '@vault-protocol/domain/ports/passkey-token.port';
import { PASSKEY_USER_REPOSITORY } from '@vault-protocol/domain/ports/passkey-user.repository';
import { WebauthnChallengeStore } from '@vault-protocol/infrastructure/webauthn-challenge.store';
import { VaultProtocolController } from '@vault-protocol/presentation/vault-protocol.controller';
import { SyncSnapshotController } from '@vault-protocol/presentation/sync-snapshot.controller';
import { SyncSnapshotHandler } from '@vault-protocol/application/sync-snapshot.handler';
import { SYNC_SNAPSHOT_REPOSITORY } from '@vault-protocol/domain/ports/sync-snapshot.token';
import { InMemorySyncSnapshotRepository } from '@vault-protocol/infrastructure/in-memory-sync-snapshot.repository';
import { PostgresSyncSnapshotRepository } from '@vault-protocol/infrastructure/postgres-sync-snapshot.repository';
import { GetVaultBootstrapHandler } from '@vault-protocol/application/get-vault-bootstrap.handler';
import { VaultBootstrapController } from '@vault-protocol/presentation/vault-bootstrap.controller';
import { VAULT_BOOTSTRAP_REPOSITORY } from '@vault-protocol/domain/ports/vault-bootstrap.token';
import { InMemoryVaultBootstrapRepository } from '@vault-protocol/infrastructure/in-memory-vault-bootstrap.repository';
import { PostgresVaultBootstrapRepository } from '@vault-protocol/infrastructure/postgres-vault-bootstrap.repository';
import { WebauthnChallengeController } from '@vault-protocol/presentation/webauthn-challenge.controller';
import { WebauthnChallengeHandler } from '@vault-protocol/application/webauthn-challenge.handler';
import { WEBAUTHN_CHALLENGE_STORE } from '@vault-protocol/domain/ports/webauthn-challenge.token';
import { PostgresWebauthnChallengeStore } from '@vault-protocol/infrastructure/postgres-webauthn-challenge.store';
import { PrepareSignedEnrollmentHandler } from '@vault-protocol/application/commands/prepare-signed-enrollment';
import { FinalizeSignedEnrollmentHandler } from '@vault-protocol/application/commands/finalize-signed-enrollment';
import { ConfirmSignedEnrollmentHandler } from '@vault-protocol/application/commands/confirm-signed-enrollment';
import { SignedEnrollmentController } from '@vault-protocol/presentation/controllers/signed-enrollment';
import { SIGNED_ENROLLMENT_REPOSITORY } from '@vault-protocol/domain/ports/signed-enrollment';
import { ENROLLMENT_PROOF_VERIFIER } from '@vault-protocol/domain/ports/enrollment-proof-verifier';
import { EnrollmentProofVerifierAdapter } from '@vault-protocol/infrastructure/adapters/enrollment-proof-verifier';
import { PostgresSignedEnrollmentRepository } from '@vault-protocol/infrastructure/repositories/postgres-signed-enrollment';
import { UnavailableMemorySignedEnrollmentRepository } from '@vault-protocol/infrastructure/repositories/unavailable-memory-signed-enrollment';
import { EnableHighSecurityHandler } from '@vault-protocol/application/enable-high-security.handler';
import { VaultSecurityController } from '@vault-protocol/presentation/vault-security.controller';
import { VAULT_SECURITY_REPOSITORY } from '@vault-protocol/domain/ports/vault-security.repository';
import { InMemoryVaultSecurityRepository } from '@vault-protocol/infrastructure/in-memory-vault-security.repository';
import { PostgresVaultSecurityRepository } from '@vault-protocol/infrastructure/postgres-vault-security.repository';
import { WebauthnCredentialHandler } from '@vault-protocol/application/webauthn-credential.handler';
import { WebauthnCredentialController } from '@vault-protocol/presentation/webauthn-credential.controller';
import { WEBAUTHN_CREDENTIAL_REPOSITORY } from '@vault-protocol/domain/ports/webauthn-credential.repository';
import { InMemoryWebauthnCredentialRepository } from '@vault-protocol/infrastructure/in-memory-webauthn-credential.repository';
import { PostgresWebauthnCredentialRepository } from '@vault-protocol/infrastructure/postgres-webauthn-credential.repository';
import { createRepositoryProvider } from '@shared/infrastructure/database/persistence.provider';
import { PasskeyLoginHandler } from '@vault-protocol/application/passkey-login.handler';
import { PasskeyAuthController } from '@vault-protocol/presentation/passkey-auth.controller';
import { VaultDeviceHandler } from '@vault-protocol/application/vault-device.handler';
import { VaultDeviceController } from '@vault-protocol/presentation/vault-device.controller';
import { VAULT_DEVICE_REPOSITORY } from '@vault-protocol/domain/ports/vault-device.token';
import { InMemoryVaultDeviceRepository } from '@vault-protocol/infrastructure/in-memory-vault-device.repository';
import { PostgresVaultDeviceRepository } from '@vault-protocol/infrastructure/postgres-vault-device.repository';
import { RotateVaultHandler } from '@vault-protocol/application/rotate-vault.handler';
import { VAULT_ROTATION_REPOSITORY } from '@vault-protocol/domain/ports/vault-rotation.repository';
import { InMemoryVaultRotationRepository } from '@vault-protocol/infrastructure/in-memory-vault-rotation.repository';
import { InMemoryVaultProtocolState } from '@vault-protocol/infrastructure/in-memory-vault-protocol-state';
import { PostgresVaultRotationRepository } from '@vault-protocol/infrastructure/postgres-vault-rotation.repository';
import { PrepareRecoveryRegistrationHandler } from '@vault-protocol/application/commands/prepare-recovery-registration';
import { ConfirmRecoveryRegistrationHandler } from '@vault-protocol/application/commands/confirm-recovery-registration';
import { RECOVERY_REGISTRATION_REPOSITORY } from '@vault-protocol/domain/ports/recovery-registration';
import { VAULT_SIGNATURE_VERIFIER } from '@vault-protocol/domain/ports/vault-signature-verifier';
import { VaultSignatureVerifierAdapter } from '@vault-protocol/infrastructure/adapters/vault-signature-verifier';
import { PostgresRecoveryRegistrationRepository } from '@vault-protocol/infrastructure/repositories/postgres-recovery-registration';
import { UnavailableMemoryRecoveryRegistrationRepository } from '@vault-protocol/infrastructure/repositories/unavailable-memory-recovery-registration';
import { RecoveryRegistrationController } from '@vault-protocol/presentation/controllers/recovery-registration';

@Module({
  imports: [AuthModule],
  controllers: [
    VaultProtocolController,
    SyncSnapshotController,
    VaultBootstrapController,
    WebauthnChallengeController,
    SignedEnrollmentController,
    VaultSecurityController,
    WebauthnCredentialController,
    PasskeyAuthController,
    VaultDeviceController,
    RecoveryRegistrationController,
  ],
  providers: [
    IssueServerShareHandler,
    SyncSnapshotHandler,
    GetVaultBootstrapHandler,
    PrepareSignedEnrollmentHandler,
    FinalizeSignedEnrollmentHandler,
    ConfirmSignedEnrollmentHandler,
    EnableHighSecurityHandler,
    WebauthnCredentialHandler,
    WebauthnChallengeHandler,
    PasskeyLoginHandler,
    VaultDeviceHandler,
    RotateVaultHandler,
    PrepareRecoveryRegistrationHandler,
    ConfirmRecoveryRegistrationHandler,
    InMemoryVaultProtocolState,
    { provide: WEBAUTHN_VERIFIER, useClass: WebauthnVerifierAdapter },
    {
      provide: VAULT_SIGNATURE_VERIFIER,
      useClass: VaultSignatureVerifierAdapter,
    },
    createRepositoryProvider(
      RECOVERY_REGISTRATION_REPOSITORY,
      PostgresRecoveryRegistrationRepository,
      UnavailableMemoryRecoveryRegistrationRepository,
    ),
    { provide: PASSKEY_USER_REPOSITORY, useExisting: USER_REPOSITORY },
    { provide: PASSKEY_TOKEN_PORT, useExisting: TOKEN_PORT },
    createRepositoryProvider(
      WEBAUTHN_CHALLENGE_STORE,
      PostgresWebauthnChallengeStore,
      WebauthnChallengeStore,
    ),
    createRepositoryProvider(
      SIGNED_ENROLLMENT_REPOSITORY,
      PostgresSignedEnrollmentRepository,
      UnavailableMemorySignedEnrollmentRepository,
    ),
    {
      provide: ENROLLMENT_PROOF_VERIFIER,
      useClass: EnrollmentProofVerifierAdapter,
    },
    createRepositoryProvider(
      SERVER_SHARE_REPOSITORY,
      PostgresServerShareRepository,
      InMemoryServerShareRepository,
    ),
    createRepositoryProvider(
      SYNC_SNAPSHOT_REPOSITORY,
      PostgresSyncSnapshotRepository,
      InMemorySyncSnapshotRepository,
    ),
    createRepositoryProvider(
      VAULT_BOOTSTRAP_REPOSITORY,
      PostgresVaultBootstrapRepository,
      InMemoryVaultBootstrapRepository,
    ),
    createRepositoryProvider(
      VAULT_SECURITY_REPOSITORY,
      PostgresVaultSecurityRepository,
      InMemoryVaultSecurityRepository,
    ),
    createRepositoryProvider(
      WEBAUTHN_CREDENTIAL_REPOSITORY,
      PostgresWebauthnCredentialRepository,
      InMemoryWebauthnCredentialRepository,
    ),
    createRepositoryProvider(
      VAULT_DEVICE_REPOSITORY,
      PostgresVaultDeviceRepository,
      InMemoryVaultDeviceRepository,
    ),
    createRepositoryProvider(
      VAULT_ROTATION_REPOSITORY,
      PostgresVaultRotationRepository,
      InMemoryVaultRotationRepository,
    ),
  ],
  exports: [IssueServerShareHandler],
})
export class VaultProtocolModule {}
