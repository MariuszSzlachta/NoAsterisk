import type {
  AvailableVaultBootstrap,
  EmptyVaultBootstrap,
  EnrollmentRequiredVaultBootstrap,
} from '@vault-protocol/domain/ports/vault-bootstrap.types';

const protocol: {
  readonly protocolVersion: 2;
  readonly cryptoSuite: 'HKDF-SHA256/AES-256-GCM';
} = {
  protocolVersion: 2,
  cryptoSuite: 'HKDF-SHA256/AES-256-GCM',
};

interface BootstrapKeyset {
  readonly vaultId: string;
  readonly keyId: string;
  readonly recoveryPublicKey: string | null;
}

interface BootstrapEnvelope {
  readonly purpose: string;
  readonly envelope: string;
}

export const mapEmptyVaultBootstrap = (
  deviceId: string,
): EmptyVaultBootstrap => ({
  status: 'empty',
  deviceId,
  ...protocol,
});

export const mapEnrollmentRequiredVaultBootstrap = ({
  deviceId,
  vaultId,
  keyId,
  recoveryPublicKey,
}: {
  readonly deviceId: string;
  readonly vaultId: string;
  readonly keyId?: string;
  readonly recoveryPublicKey?: string | null;
}): EnrollmentRequiredVaultBootstrap => ({
  status: 'enrollment-required',
  deviceId,
  vaultId,
  ...protocol,
  ...(keyId === undefined ? {} : { keyId }),
  ...(recoveryPublicKey === null || recoveryPublicKey === undefined
    ? {}
    : { recoveryPublicKey }),
});

export const mapAvailableVaultBootstrap = ({
  deviceId,
  keyset,
  securityProfile,
  envelopes,
}: {
  readonly deviceId: string;
  readonly keyset: BootstrapKeyset;
  readonly securityProfile: 'standard' | 'high-security';
  readonly envelopes: ReadonlyArray<BootstrapEnvelope>;
}): AvailableVaultBootstrap => {
  const deviceEnvelope = envelopes.find(
    (item) => item.purpose === 'device-wrap',
  )?.envelope;
  const passkeyEnvelope = envelopes.find(
    (item) => item.purpose === 'passkey-wrap',
  )?.envelope;
  const shared: Omit<
    AvailableVaultBootstrap,
    'deviceEnvelope' | 'passkeyEnvelope'
  > = {
    status: 'available',
    deviceId,
    vaultId: keyset.vaultId,
    keyId: keyset.keyId,
    securityProfile,
    ...protocol,
    ...(keyset.recoveryPublicKey === null
      ? {}
      : { recoveryPublicKey: keyset.recoveryPublicKey }),
  };
  if (deviceEnvelope === undefined) {
    if (passkeyEnvelope === undefined)
      throw new Error('Vault device envelope is missing');
    return { ...shared, passkeyEnvelope };
  }
  return {
    ...shared,
    deviceEnvelope,
    ...(passkeyEnvelope === undefined ? {} : { passkeyEnvelope }),
  };
};
