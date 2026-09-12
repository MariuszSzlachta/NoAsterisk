import { vaultProtocol } from '#shared/adapters/vault-protocol/vault-protocol';

interface VaultSessionKeys {
  readonly local: CryptoKey;
  readonly sync: CryptoKey;
  readonly check: CryptoKey;
}

interface VaultSession {
  readonly unlock: (
    vmk: Uint8Array,
    context: Parameters<typeof vaultProtocol.deriveKeys>[1],
  ) => Promise<void>;
  readonly lock: () => void;
  readonly isUnlocked: () => boolean;
  readonly requireKeys: () => VaultSessionKeys;
  readonly runIfCurrent: <T>(
    task: (keys: VaultSessionKeys) => Promise<T>,
  ) => Promise<T>;
}

export const createVaultSession = (): VaultSession => {
  let keys: VaultSessionKeys | undefined;
  let generation = 0;

  const lock = (): void => {
    generation += 1;
    keys = undefined;
  };

  const requireKeys = (): VaultSessionKeys => {
    if (keys === undefined) throw new Error('Vault is locked');
    return keys;
  };

  return {
    unlock: async (vmk, context) => {
      const nextGeneration = ++generation;
      try {
        const nextKeys = await vaultProtocol.deriveKeys(vmk, context);
        if (generation !== nextGeneration)
          throw new Error('Vault unlock cancelled');
        keys = nextKeys;
      } finally {
        vmk.fill(0);
      }
    },
    lock,
    isUnlocked: () => keys !== undefined,
    requireKeys,
    runIfCurrent: async (task) => {
      const startedGeneration = generation;
      const currentKeys = requireKeys();
      const result = await task(currentKeys);
      if (generation !== startedGeneration || keys === undefined)
        throw new Error('Vault operation cancelled');
      return result;
    },
  };
};
