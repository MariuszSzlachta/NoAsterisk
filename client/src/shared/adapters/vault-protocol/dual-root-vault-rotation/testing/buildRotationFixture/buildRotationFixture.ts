import type { VaultV2RotationJournal } from '#shared/adapters/persistence/dexie';
import { deviceSigningKey } from '#shared/adapters/vault-protocol/device-signing-key';
import type { RotationFixture } from '#shared/adapters/vault-protocol/dual-root-vault-rotation/testing/buildRotationFixture/types';
import { deriveRecoveryPublicKey } from '#shared/adapters/vault-protocol/recovery-authority';
import { encodeRecoveryBackup } from '#shared/adapters/vault-protocol/recovery-backup/encode';
import type { RotationTranscriptSnapshot } from '#shared/adapters/vault-protocol/rotation-transcript';
import { vaultProtocol } from '#shared/adapters/vault-protocol/vault-protocol';
import type { AvailableVaultBootstrapMetadata } from '#shared/api/vault-protocol/get-vault-bootstrap/types';
import { bytesToHex } from '#shared/lib/bytes-to-hex';

export const buildRotationFixture = async (): Promise<RotationFixture> => {
  const context = {
    accountId: 'synthetic-account',
    workspaceId: 'synthetic-workspace',
    vaultId: crypto.randomUUID(),
    deviceId: 'synthetic-device',
    keyId: 'current-key',
  };
  const vmk = new Uint8Array(32).fill(1);
  const recoverySeed = new Uint8Array(32).fill(2);
  const nextVmk = new Uint8Array(32).fill(3);
  const nextSeed = new Uint8Array(32).fill(4);
  const signing = await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign', 'verify'],
  );
  const keys = await vaultProtocol.deriveKeys(vmk, context);
  const nextContext = { ...context, keyId: 'next-key' };
  const nextKeys = await vaultProtocol.deriveKeys(nextVmk, nextContext);
  const transcript: RotationTranscriptSnapshot = {
    accountId: context.accountId,
    workspaceId: context.workspaceId,
    vaultId: context.vaultId,
    deviceId: context.deviceId,
    currentKeyId: context.keyId,
    nextKeyId: nextContext.keyId,
    challenge: 'A'.repeat(43),
    expiresAt: new Date(Date.now() - 1_000).toISOString(),
    currentRecoveryPublicKey: bytesToHex(deriveRecoveryPublicKey(recoverySeed)),
    nextRecoveryPublicKey: bytesToHex(deriveRecoveryPublicKey(nextSeed)),
    signingPublicKey: JSON.stringify(
      await deviceSigningKey.exportPublicJwk(signing.publicKey),
    ),
    envelopePurpose: 'device-wrap',
    envelope: 'opaque-next-envelope',
  };
  const currentVmkEnvelope = await vaultProtocol.encryptRecord(
    JSON.stringify(Array.from(nextVmk)),
    { ...context, collection: '__vault_rotation__', recordId: 'next-vmk' },
    keys.local,
  );
  const nextVmkEnvelope = await vaultProtocol.encryptRecord(
    JSON.stringify(Array.from(nextVmk)),
    { ...nextContext, collection: '__vault_rotation__', recordId: 'next-vmk' },
    nextKeys.local,
  );
  const pending: VaultV2RotationJournal = {
    currentKeyId: context.keyId,
    nextKeyId: nextContext.keyId,
    idempotencyKey: transcript.challenge,
    recoveryBackupConfirmed: true,
    transcript,
    envelopePurpose: 'device-wrap',
    envelope: transcript.envelope,
    currentVmkEnvelope,
    nextVmkEnvelope,
  };
  const bootstrap: AvailableVaultBootstrapMetadata = {
    status: 'available',
    ...context,
    protocolVersion: 2,
    cryptoSuite: 'HKDF-SHA256/AES-256-GCM',
    securityProfile: 'standard',
    recoveryPublicKey: transcript.currentRecoveryPublicKey,
    deviceEnvelope: '{}',
  };
  const backup = await encodeRecoveryBackup({ vmk, recoverySeed });
  const nextBackup = await encodeRecoveryBackup({
    vmk: nextVmk,
    recoverySeed: nextSeed,
  });
  vmk.fill(0);
  recoverySeed.fill(0);
  nextVmk.fill(0);
  nextSeed.fill(0);
  return {
    material: {
      syncKey: keys.sync,
      signingKey: signing.privateKey,
      verifyKey: signing.publicKey,
      context,
    },
    nextMaterial: {
      syncKey: nextKeys.sync,
      signingKey: signing.privateKey,
      verifyKey: signing.publicKey,
      context: nextContext,
    },
    pending,
    transcript,
    bootstrap,
    backup,
    nextBackup,
    localShare: await vaultProtocol.generateLocalShare(),
  };
};
