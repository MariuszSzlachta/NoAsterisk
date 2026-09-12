import { Inject, Injectable } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import { DRIZZLE } from '@shared/infrastructure/database/database.tokens';
import { DrizzleDatabase } from '@shared/infrastructure/database/database.providers';
import {
  vaultDeviceEnvelopes,
  vaultDevices,
  vaultKeysets,
  vaults,
} from '@shared/infrastructure/database/schema';
import type {
  VaultBootstrap,
  VaultBootstrapRepository,
} from '@vault-protocol/domain/ports/vault-bootstrap.repository';

@Injectable()
export class PostgresVaultBootstrapRepository implements VaultBootstrapRepository {
  constructor(@Inject(DRIZZLE) private readonly db: DrizzleDatabase) {}

  async get(
    userId: string,
    workspaceId: string,
    deviceId: string,
  ): Promise<VaultBootstrap> {
    const keysets = await this.db
      .select({
        keysetId: vaultKeysets.id,
        vaultId: vaults.id,
        keyId: vaultKeysets.keyId,
        protocolVersion: vaultKeysets.protocolVersion,
        cryptoSuite: vaultKeysets.cryptoSuite,
      })
      .from(vaultKeysets)
      .innerJoin(vaults, eq(vaultKeysets.vaultId, vaults.id))
      .where(eq(vaults.workspaceId, workspaceId));
    const keyset = keysets[0];
    if (!keyset) {
      const existingVault = await this.db
        .select({ vaultId: vaults.id })
        .from(vaults)
        .where(eq(vaults.workspaceId, workspaceId));
      const legacyVault = existingVault[0];
      if (legacyVault) {
        return {
          status: 'enrollment-required',
          vaultId: legacyVault.vaultId,
          deviceId,
          protocolVersion: 2,
          cryptoSuite: 'HKDF-SHA256/AES-256-GCM',
        };
      }
      return {
        status: 'empty',
        deviceId,
        protocolVersion: 2,
        cryptoSuite: 'HKDF-SHA256/AES-256-GCM',
      };
    }
    if (
      keyset.protocolVersion !== '2' ||
      keyset.cryptoSuite !== 'HKDF-SHA256/AES-256-GCM'
    )
      throw new Error('Unsupported vault protocol');

    const deviceRows = await this.db
      .select({
        deviceRowId: vaultDevices.id,
        securityProfile: vaultDevices.status,
      })
      .from(vaultDevices)
      .where(
        and(
          eq(vaultDevices.userId, userId),
          eq(vaultDevices.keysetId, keyset.keysetId),
          eq(vaultDevices.deviceId, deviceId),
          eq(vaultDevices.revoked, false),
          inArray(vaultDevices.status, ['active', 'high-security']),
        ),
      );
    const device = deviceRows[0];
    if (!device) {
      return {
        status: 'enrollment-required',
        vaultId: keyset.vaultId,
        keyId: keyset.keyId,
        deviceId,
        protocolVersion: 2,
        cryptoSuite: 'HKDF-SHA256/AES-256-GCM',
      };
    }

    const envelopes = await this.db
      .select({
        purpose: vaultDeviceEnvelopes.purpose,
        envelope: vaultDeviceEnvelopes.envelope,
      })
      .from(vaultDeviceEnvelopes)
      .where(eq(vaultDeviceEnvelopes.deviceId, device.deviceRowId));
    const deviceEnvelope = envelopes.find(
      (item) => item.purpose === 'device-wrap',
    )?.envelope;
    const passkeyEnvelope = envelopes.find(
      (item) => item.purpose === 'passkey-wrap',
    )?.envelope;
    if (deviceEnvelope === undefined && passkeyEnvelope === undefined)
      throw new Error('Vault device envelope is missing');
    return {
      status: 'available',
      vaultId: keyset.vaultId,
      keyId: keyset.keyId,
      deviceId,
      protocolVersion: 2,
      cryptoSuite: 'HKDF-SHA256/AES-256-GCM',
      securityProfile:
        device.securityProfile === 'high-security'
          ? 'high-security'
          : 'standard',
      ...(deviceEnvelope === undefined ? {} : { deviceEnvelope }),
      ...(passkeyEnvelope === undefined ? {} : { passkeyEnvelope }),
    };
  }
}
