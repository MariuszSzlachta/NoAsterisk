import { vaultProtocolConstants } from '#shared/adapters/vault-protocol/vault-protocol-constants';
import { vaultProtocol } from '#shared/adapters/vault-protocol/vault-protocol';
import { vaultSecurity } from '#shared/api/vault-protocol/vault-security';
import { encryptedPersistence } from '#shared/adapters/persistence';
import { recoveryCode } from '#shared/adapters/vault-protocol/recovery-code';

interface HighSecurityContext {
  readonly accountId: string;
  readonly workspaceId: string;
  readonly vaultId: string;
  readonly keyId: string;
  readonly deviceId: string;
  readonly credentialId: string;
}

const assertRecoveryMatchesVmk = async (
  vmk: Uint8Array,
  code: string,
): Promise<void> => {
  const recoveryVmk = await recoveryCode.restore(code);
  try {
    if (
      recoveryVmk.length !== vmk.length ||
      recoveryVmk.some((byte, index) => byte !== vmk[index])
    )
      throw new Error('Recovery confirmation failed');
  } finally {
    recoveryVmk.fill(0);
  }
};

const enable = async (input: {
  readonly context: HighSecurityContext;
  readonly localShare: CryptoKey;
  readonly serverShare: Uint8Array;
  readonly deviceEnvelope: unknown;
  readonly prfKey: CryptoKey;
  readonly recoveryCode: string;
}): Promise<void> => {
  const deviceContext = {
    accountId: input.context.accountId,
    workspaceId: input.context.workspaceId,
    vaultId: input.context.vaultId,
    keyId: input.context.keyId,
    deviceId: input.context.deviceId,
  };
  const vmk = await vaultProtocol.unwrapVmk(
    input.deviceEnvelope,
    await vaultProtocol.deriveDeviceKey(
      input.localShare,
      input.serverShare,
      deviceContext,
    ),
    deviceContext,
    vaultProtocolConstants.deviceWrapPurpose,
  );
  try {
    await assertRecoveryMatchesVmk(vmk, input.recoveryCode);
    const prfWrappingKey = await vaultProtocol.derivePrfKey(
      input.prfKey,
      input.serverShare,
      input.context,
    );
    const passkeyEnvelope = await vaultProtocol.wrapVmk(
      vmk,
      prfWrappingKey,
      input.context,
      vaultProtocolConstants.passkeyWrapPurpose,
    );
    await vaultSecurity.enableHighSecurity({
      vaultId: input.context.vaultId,
      keyId: input.context.keyId,
      deviceId: input.context.deviceId,
      passkeyEnvelope: JSON.stringify(passkeyEnvelope),
    });
    await encryptedPersistence.removeVaultLocalShare(input.context);
  } finally {
    vmk.fill(0);
    input.serverShare.fill(0);
  }
};

const disable = async (input: {
  readonly context: HighSecurityContext;
  readonly serverShare: Uint8Array;
  readonly passkeyEnvelope: unknown;
  readonly prfKey: CryptoKey;
  readonly recoveryCode: string;
}): Promise<void> => {
  const vmk = await vaultProtocol.unwrapVmk(
    input.passkeyEnvelope,
    await vaultProtocol.derivePrfKey(
      input.prfKey,
      input.serverShare,
      input.context,
    ),
    input.context,
    vaultProtocolConstants.passkeyWrapPurpose,
  );
  try {
    await assertRecoveryMatchesVmk(vmk, input.recoveryCode);
    const localShare = await vaultProtocol.generateLocalShare();
    const deviceContext = {
      accountId: input.context.accountId,
      workspaceId: input.context.workspaceId,
      vaultId: input.context.vaultId,
      keyId: input.context.keyId,
      deviceId: input.context.deviceId,
    };
    const deviceEnvelope = await vaultProtocol.wrapVmk(
      vmk,
      await vaultProtocol.deriveDeviceKey(
        localShare,
        input.serverShare,
        deviceContext,
      ),
      deviceContext,
      vaultProtocolConstants.deviceWrapPurpose,
    );
    await vaultSecurity.disableHighSecurity({
      vaultId: input.context.vaultId,
      keyId: input.context.keyId,
      deviceId: input.context.deviceId,
      deviceEnvelope: JSON.stringify(deviceEnvelope),
    });
    await encryptedPersistence.storeVaultLocalShare(deviceContext, localShare);
  } finally {
    vmk.fill(0);
    input.serverShare.fill(0);
  }
};

export const highSecurity = Object.freeze({ enable, disable });
