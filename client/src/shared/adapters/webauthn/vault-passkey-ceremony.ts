import { passkeyPrf } from '#shared/adapters/webauthn/passkey-prf';
import { createPasskeyPrfSalt } from '#shared/adapters/webauthn/passkey-prf-salt';
import { webauthnChallenge } from '#shared/api/vault-protocol/webauthn-challenge';
import { webauthnCredentials } from '#shared/api/vault-protocol/webauthn-credentials';

interface VaultPasskeyContext {
  readonly accountId: string;
  readonly workspaceId: string;
  readonly vaultId: string;
  readonly keyId: string;
  readonly deviceId: string;
}

const decodeCredentialId = (value: string): Uint8Array<ArrayBuffer> => {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  binary.split('').forEach((character, index) => {
    bytes[index] = character.charCodeAt(0);
  });
  return bytes;
};

const run = async (
  context: VaultPasskeyContext,
  credentialId?: string,
) => {
  const challenge =
    await webauthnChallenge.createAuthenticationChallengeRecord(
      context.vaultId,
      context.deviceId,
    );
  const passkey = await passkeyPrf.run({
    challenge: challenge.bytes,
    salt: await createPasskeyPrfSalt({
      accountId: context.accountId,
      workspaceId: context.workspaceId,
      vaultId: context.vaultId,
      deviceId: context.deviceId,
    }),
    ...(credentialId === undefined
      ? {}
      : { credentialIds: [decodeCredentialId(credentialId)] }),
    requirePrf: true,
  });
  if (passkey.prfKey === undefined)
    throw new Error('Passkey PRF is not supported by this credential');
  await webauthnCredentials.verifyAuthentication({
    vaultId: context.vaultId,
    deviceId: context.deviceId,
    challenge: challenge.encoded,
    assertion: passkey.assertion,
  });
  return { ...passkey, prfKey: passkey.prfKey };
};

export const vaultPasskeyCeremony = Object.freeze({ run });
