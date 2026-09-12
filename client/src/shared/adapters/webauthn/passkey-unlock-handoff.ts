import type { PasskeyPrfContext } from './passkey-prf-salt';

export interface PasskeyUnlockHandoff {
  readonly context: PasskeyPrfContext & { readonly keyId: string };
  readonly credentialId: string;
  readonly prfKey: CryptoKey | undefined;
}

let pending: PasskeyUnlockHandoff | undefined;

const set = (handoff: PasskeyUnlockHandoff): void => {
  pending = handoff;
};

const consume = (
  context: PasskeyUnlockHandoff['context'],
): PasskeyUnlockHandoff | undefined => {
  const current = pending;
  pending = undefined;
  if (
    current === undefined ||
    current.context.accountId !== context.accountId ||
    current.context.workspaceId !== context.workspaceId ||
    current.context.vaultId !== context.vaultId ||
    current.context.keyId !== context.keyId ||
    current.context.deviceId !== context.deviceId
  )
    return undefined;
  return current;
};

const clear = (): void => {
  pending = undefined;
};

export const passkeyUnlockHandoff = Object.freeze({ set, consume, clear });
