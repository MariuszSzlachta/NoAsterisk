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

const run = async (context: VaultPasskeyContext) => {
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
