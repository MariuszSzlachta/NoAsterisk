import { unlockPolicy } from '#shared/adapters/vault-protocol/unlock-policy';
import { vaultProtocol } from '#shared/adapters/vault-protocol/vault-protocol';
import { vaultProtocolConstants } from '#shared/adapters/vault-protocol/vault-protocol-constants';

interface UnlockContext {
  readonly accountId: string;
  readonly workspaceId: string;
  readonly vaultId: string;
  readonly keyId: string;
  readonly deviceId: string;
  readonly credentialId?: string;
}

interface UnlockInput {
  readonly mode: 'standard' | 'high-security';
  readonly localShare?: CryptoKey;
  readonly serverShare: Uint8Array;
  readonly envelope: unknown;
  readonly context: UnlockContext;
  readonly prfKey?: CryptoKey;
}

interface VaultKeySet {
  readonly local: CryptoKey;
  readonly sync: CryptoKey;
  readonly check: CryptoKey;
  readonly method: 'split' | 'prf';
  readonly vmk: Uint8Array;
}

const unlock = async (input: UnlockInput): Promise<VaultKeySet> => {
  const method = unlockPolicy.chooseMethod(
    input.mode,
    input.prfKey !== undefined,
  );
  try {
    const wrappingKey =
      method === 'prf'
        ? await vaultProtocol.derivePrfKey(
            input.prfKey ?? (() => { throw new Error('PRF key is required'); })(),
            input.serverShare,
            input.context,
          )
        : await vaultProtocol.deriveDeviceKey(
            input.localShare ??
              (() => { throw new Error('LocalShare is required for split unlock'); })(),
            input.serverShare,
            input.context,
          );
    const vmk = await vaultProtocol.unwrapVmk(
      input.envelope,
      wrappingKey,
      input.context,
      method === 'prf'
        ? vaultProtocolConstants.passkeyWrapPurpose
        : vaultProtocolConstants.deviceWrapPurpose,
    );
    try {
      return {
        ...(await vaultProtocol.deriveKeys(vmk, input.context)),
        method,
        vmk: vmk.slice(),
      };
    } finally {
      vmk.fill(0);
    }
  } finally {
    input.serverShare.fill(0);
  }
};

export const unlockCoordinator = Object.freeze({ unlock });
