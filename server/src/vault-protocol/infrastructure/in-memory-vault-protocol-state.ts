import { randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import type { VaultBootstrap } from '@vault-protocol/domain/ports/vault-bootstrap.repository';
import type {
  EnrollmentPreparation,
  VaultEnrollmentConfirmation,
  VaultEnrollmentRequest,
} from '@vault-protocol/domain/ports/vault-enrollment.repository';

interface PendingEnrollment {
  readonly userId: string;
  readonly workspaceId: string;
  readonly deviceId: string;
  readonly vaultId: string | undefined;
  readonly serverShare: Uint8Array;
  readonly expiresAt: number;
}

interface DeviceState {
  readonly challenge?: string;
  readonly userId: string;
  readonly workspaceId: string;
  readonly vaultId: string;
  readonly keyId: string;
  readonly deviceId: string;
  readonly deviceEnvelope: string;
  readonly serverShare: Uint8Array;
  status: 'pending' | 'active' | 'revoked';
}

const TTL_MS = 60_000;
const PROTOCOL_VERSION = 2 as const;
const CRYPTO_SUITE = 'HKDF-SHA256/AES-256-GCM' as const;

const deviceKey = (
  userId: string,
  workspaceId: string,
  deviceId: string,
): string => `${userId}:${workspaceId}:${deviceId}`;

@Injectable()
export class InMemoryVaultProtocolState {
  private readonly pending = new Map<string, PendingEnrollment>();
  private readonly completed = new Map<string, DeviceState>();
  private readonly workspaceVaults = new Map<
    string,
    { vaultId: string; keyId: string }
  >();

  prepare(
    userId: string,
    workspaceId: string,
    deviceId: string,
    vaultId: string | undefined,
  ): EnrollmentPreparation {
    if (vaultId === undefined && this.workspaceVaults.has(workspaceId))
      throw new Error('Vault already exists in workspace');
    const challenge = randomBytes(32).toString('base64url');
    const expiresAt = Date.now() + TTL_MS;
    const serverShare = new Uint8Array(randomBytes(32));
    this.pending.set(challenge, {
      userId,
      workspaceId,
      deviceId,
      vaultId,
      serverShare,
      expiresAt,
    });
    return {
      challenge,
      serverShare: serverShare.slice(),
      expiresAt: new Date(expiresAt).toISOString(),
    };
  }

  finalize(request: VaultEnrollmentRequest): void {
    const pending = this.pending.get(request.challenge);
    this.pending.delete(request.challenge);
    if (
      pending === undefined ||
      pending.expiresAt < Date.now() ||
      pending.userId !== request.userId ||
      pending.workspaceId !== request.workspaceId ||
      pending.deviceId !== request.deviceId ||
      (pending.vaultId !== undefined && pending.vaultId !== request.vaultId)
    )
      throw new Error('Invalid enrollment challenge');

    const existingVault = this.workspaceVaults.get(request.workspaceId);
    if (
      existingVault !== undefined &&
      (existingVault.vaultId !== request.vaultId ||
        existingVault.keyId !== request.keyId)
    )
      throw new Error('Vault key context mismatch');
    if (existingVault !== undefined && request.trustedDeviceProof === undefined)
      throw new Error('Trusted-device approval required');
    if (existingVault === undefined)
      this.workspaceVaults.set(request.workspaceId, {
        vaultId: request.vaultId,
        keyId: request.keyId,
      });

    const key = deviceKey(
      request.userId,
      request.workspaceId,
      request.deviceId,
    );
    const current = this.completed.get(key);
    if (current?.status === 'active')
      throw new Error('Vault device is already enrolled');
    this.completed.set(key, {
      challenge: request.challenge,
      userId: request.userId,
      workspaceId: request.workspaceId,
      vaultId: request.vaultId,
      keyId: request.keyId,
      deviceId: request.deviceId,
      deviceEnvelope: request.deviceEnvelope,
      serverShare: pending.serverShare.slice(),
      status: 'pending',
    });
  }

  confirm(request: VaultEnrollmentConfirmation): void {
    const key = deviceKey(
      request.userId,
      request.workspaceId,
      request.deviceId,
    );
    const device = this.completed.get(key);
    if (
      device === undefined ||
      device.status !== 'pending' ||
      device.challenge !== request.challenge ||
      device.vaultId !== request.vaultId ||
      device.keyId !== request.keyId
    )
      throw new Error('Invalid enrollment confirmation');
    device.status = 'active';
  }

  getBootstrap(
    userId: string,
    workspaceId: string,
    deviceId: string,
  ): VaultBootstrap {
    const vault = this.workspaceVaults.get(workspaceId);
    if (vault === undefined)
      return {
        status: 'empty',
        deviceId,
        protocolVersion: PROTOCOL_VERSION,
        cryptoSuite: CRYPTO_SUITE,
      };
    const device = this.completed.get(deviceKey(userId, workspaceId, deviceId));
    if (device?.status !== 'active')
      return {
        status: 'enrollment-required',
        vaultId: vault.vaultId,
        keyId: vault.keyId,
        deviceId,
        protocolVersion: PROTOCOL_VERSION,
        cryptoSuite: CRYPTO_SUITE,
      };
    return {
      status: 'available',
      vaultId: device.vaultId,
      keyId: device.keyId,
      deviceId: device.deviceId,
      protocolVersion: PROTOCOL_VERSION,
      cryptoSuite: CRYPTO_SUITE,
      securityProfile: 'standard',
      deviceEnvelope: device.deviceEnvelope,
    };
  }

  issueServerShare(
    userId: string,
    workspaceId: string,
    deviceId: string,
  ): Uint8Array | undefined {
    const device = this.completed.get(deviceKey(userId, workspaceId, deviceId));
    if (device?.status !== 'active') return undefined;
    return device.serverShare.slice();
  }

  seedServerShare(userId: string, workspaceId: string, deviceId: string): void {
    const key = deviceKey(userId, workspaceId, deviceId);
    if (this.completed.has(key)) return;
    const serverShare = new Uint8Array(randomBytes(32));
    this.completed.set(key, {
      challenge: undefined,
      userId,
      workspaceId,
      vaultId: '',
      keyId: '',
      deviceId,
      deviceEnvelope: '',
      serverShare,
      status: 'active',
    });
  }
}
