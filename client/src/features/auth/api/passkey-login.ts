import { API_CONTRACT } from '#features/auth/api/constants';
import { PASSKEY_CHALLENGE_PATTERN } from '#features/auth/api/passkey-challenge-pattern';
import { canonicalizeEmail } from '#features/auth/model/canonicalize-email';
import { parseAuthResponse } from '#features/auth/model/parse-auth-response';
import type { AuthResponse } from '#features/auth/model/types/auth-response';
import { encryptedPersistence } from '#shared/adapters/persistence';
import { allowlistedWebauthnDto } from '#shared/adapters/webauthn/allowlisted-webauthn-dto';
import { passkeyPrf } from '#shared/adapters/webauthn/passkey-prf';
import { createPasskeyPrfSalt } from '#shared/adapters/webauthn/passkey-prf-salt';
import { passkeyUnlockHandoff } from '#shared/adapters/webauthn/passkey-unlock-handoff';
import { apiClient } from '#shared/api';
import { authTokens } from '#shared/api/auth-tokens';
import { vaultDeviceId } from '#shared/api/vault-protocol/device-id';

interface AuthenticationOptions {
  readonly challenge: string;
  readonly rpId?: string;
  readonly timeout?: number;
  readonly userVerification?: UserVerificationRequirement;
  readonly allowCredentials?: ReadonlyArray<{
    readonly id: string;
    readonly type: 'public-key';
    readonly transports?: ReadonlyArray<AuthenticatorTransport>;
  }>;
  readonly vaultContext?: {
    readonly accountId: string;
    readonly workspaceId: string;
    readonly vaultId: string;
    readonly keyId: string;
    readonly deviceId: string;
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isBoundId = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0 && value.length <= 16_384;

const isContextId = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0 && value.length <= 128;

const isTransport = (value: unknown): value is AuthenticatorTransport =>
  value === 'ble' ||
  value === 'hybrid' ||
  value === 'internal' ||
  value === 'nfc' ||
  value === 'usb';

const decode = (value: string): ArrayBuffer => {
  if (!PASSKEY_CHALLENGE_PATTERN.test(value) || value.length > 16_384)
    throw new Error('Invalid passkey challenge');
  const padded = value
    .replaceAll('-', '+')
    .replaceAll('_', '/')
    .padEnd(Math.ceil(value.length / 4) * 4, '=');
  let binary: string;
  try {
    binary = atob(padded);
  } catch {
    throw new Error('Invalid passkey challenge');
  }
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  binary.split('').forEach((character, index) => {
    bytes[index] = character.charCodeAt(0);
  });
  return bytes.buffer;
};

const isOptions = (value: unknown): value is AuthenticationOptions =>
  isRecord(value) &&
  isBoundId(value.challenge) &&
  (value.rpId === undefined ||
    (typeof value.rpId === 'string' && value.rpId.length <= 253)) &&
  (value.timeout === undefined ||
    (typeof value.timeout === 'number' &&
      Number.isInteger(value.timeout) &&
      value.timeout > 0 &&
      value.timeout <= 120_000)) &&
  (value.userVerification === undefined ||
    value.userVerification === 'required' ||
    value.userVerification === 'preferred' ||
    value.userVerification === 'discouraged') &&
  (value.allowCredentials === undefined ||
    (Array.isArray(value.allowCredentials) &&
      value.allowCredentials.every(
        (credential) =>
          isRecord(credential) &&
          isBoundId(credential.id) &&
          credential.type === 'public-key' &&
          (credential.transports === undefined ||
            (Array.isArray(credential.transports) &&
              credential.transports.every(isTransport))),
      ))) &&
  (value.vaultContext === undefined ||
    (isRecord(value.vaultContext) &&
      isContextId(value.vaultContext.accountId) &&
      isContextId(value.vaultContext.workspaceId) &&
      isContextId(value.vaultContext.vaultId) &&
      isContextId(value.vaultContext.keyId) &&
      isContextId(value.vaultContext.deviceId)));

const run = async (email: string): Promise<AuthResponse> => {
  if (typeof navigator.credentials?.get !== 'function')
    throw new Error('Passkey login is unavailable');
  passkeyUnlockHandoff.clear();
  const normalizedEmail = canonicalizeEmail(email);
  const optionsResponse = await apiClient.post<
    unknown,
    { readonly email: string; readonly deviceId: string }
  >(
    API_CONTRACT.API_PATHS.PASSKEY_OPTIONS,
    { email: normalizedEmail, deviceId: vaultDeviceId.get() },
    { skipAuth: true },
  );
  if (!isOptions(optionsResponse)) throw new Error('Invalid passkey options');
  const challenge = decode(optionsResponse.challenge);
  if (challenge.byteLength !== 32) throw new Error('Invalid passkey challenge');
  const allowCredentials = optionsResponse.allowCredentials?.map((item) => ({
    id: decode(item.id),
    type: item.type,
    transports:
      item.transports === undefined ? undefined : [...item.transports],
  }));
  const prfResult =
    optionsResponse.vaultContext === undefined
      ? undefined
      : await passkeyPrf.run({
          challenge: new Uint8Array(challenge),
          salt: await createPasskeyPrfSalt(optionsResponse.vaultContext),
          rpId: optionsResponse.rpId,
          credentialIds: allowCredentials?.map(
            (item) => new Uint8Array(item.id),
          ),
          requirePrf: false,
        });
  const assertion =
    prfResult?.assertion ??
    allowlistedWebauthnDto.serializeAssertion(
      await navigator.credentials.get({
        publicKey: {
          challenge,
          rpId: optionsResponse.rpId,
          timeout: optionsResponse.timeout,
          userVerification: optionsResponse.userVerification,
          allowCredentials,
        },
      }),
    );
  const response = await apiClient.post<
    unknown,
    {
      readonly email: string;
      readonly challenge: string;
      readonly assertion: typeof assertion;
    }
  >(
    API_CONTRACT.API_PATHS.PASSKEY_VERIFY,
    {
      email: normalizedEmail,
      challenge: optionsResponse.challenge,
      assertion,
    },
    { skipAuth: true },
  );
  const authResponse = parseAuthResponse(response);
  authTokens.setAccessToken(authResponse.accessToken);
  encryptedPersistence.setAccountContext(
    authResponse.user.id,
    authResponse.user.workspaceId,
  );
  if (
    prfResult !== undefined &&
    optionsResponse.vaultContext !== undefined &&
    optionsResponse.vaultContext.accountId === authResponse.user.id &&
    optionsResponse.vaultContext.workspaceId === authResponse.user.workspaceId
  ) {
    passkeyUnlockHandoff.set({
      context: optionsResponse.vaultContext,
      credentialId: prfResult.credentialId,
      prfKey: prfResult.prfKey,
    });
  }
  return authResponse;
};

export const passkeyLogin = Object.freeze({ run });
