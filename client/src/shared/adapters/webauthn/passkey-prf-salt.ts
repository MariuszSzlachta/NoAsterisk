import { vaultProtocol } from '#shared/adapters/vault-protocol/vault-protocol';

export interface PasskeyPrfContext {
  readonly accountId: string;
  readonly workspaceId: string;
  readonly vaultId: string;
  readonly deviceId: string;
}

export const createPasskeyPrfSalt = async (
  context: PasskeyPrfContext,
): Promise<Uint8Array<ArrayBuffer>> =>
  new Uint8Array(
    await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(
        vaultProtocol.canonicalize({
          domain: 'budgetflow/passkey-prf-salt/v1',
          ...context,
        }),
      ),
    ),
  );
