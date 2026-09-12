import { allowlistedWebauthnDto } from '#shared/adapters/webauthn/allowlisted-webauthn-dto';
import { apiClient } from '#shared/api';
import { authTokens } from '#shared/api/auth-tokens';

interface RegistrationContext {
  readonly vaultId: string;
  readonly deviceId: string;
}

const verifyAuthentication = async (input: {
  readonly vaultId: string;
  readonly deviceId: string;
  readonly challenge: string;
  readonly assertion: ReturnType<
    typeof allowlistedWebauthnDto.serializeAssertion
  >;
}): Promise<void> => {
  const response = await apiClient.post<unknown, typeof input>(
    '/users/me/vault/webauthn/credentials/authentication/verify',
    input,
  );
  if (
    typeof response !== 'object' ||
    response === null ||
    !('accessToken' in response) ||
    typeof response.accessToken !== 'string'
  )
    throw new Error('Invalid WebAuthn step-up response');
  authTokens.setAccessToken(response.accessToken);
};

interface RegistrationOptionsResponse {
  readonly challenge: string;
  readonly rp: { readonly name: string; readonly id: string };
  readonly user: {
    readonly id: string;
    readonly name: string;
    readonly displayName: string;
  };
  readonly pubKeyCredParams: ReadonlyArray<{
    readonly alg: number;
    readonly type: 'public-key';
  }>;
  readonly timeout?: number;
  readonly attestation?: 'none' | 'direct' | 'enterprise';
  readonly authenticatorSelection?: AuthenticatorSelectionCriteria;
  readonly excludeCredentials?: ReadonlyArray<{
    readonly id: string;
    readonly transports?: ReadonlyArray<string>;
  }>;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isBoundedText = (value: unknown, max: number): value is string =>
  typeof value === 'string' && value.length > 0 && value.length <= max;

const hasOnlyKeys = (
  value: Record<string, unknown>,
  keys: ReadonlyArray<string>,
): boolean => Object.keys(value).every((key) => keys.includes(key));

const isOptions = (value: unknown): value is RegistrationOptionsResponse => {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, [
      'challenge',
      'rp',
      'user',
      'pubKeyCredParams',
      'timeout',
      'attestation',
      'authenticatorSelection',
      'excludeCredentials',
    ]) ||
    !isBoundedText(value.challenge, 16_384)
  )
    return false;
  if (
    !isRecord(value.rp) ||
    !hasOnlyKeys(value.rp, ['name', 'id']) ||
    !isBoundedText(value.rp.name, 256) ||
    !isBoundedText(value.rp.id, 253)
  )
    return false;
  if (
    !isRecord(value.user) ||
    !hasOnlyKeys(value.user, ['id', 'name', 'displayName']) ||
    !isBoundedText(value.user.id, 16_384) ||
    !isBoundedText(value.user.name, 320) ||
    !isBoundedText(value.user.displayName, 256)
  )
    return false;
  if (
    !Array.isArray(value.pubKeyCredParams) ||
    value.pubKeyCredParams.length === 0 ||
    value.pubKeyCredParams.length > 32 ||
    !value.pubKeyCredParams.every(
      (item) =>
        isRecord(item) &&
        hasOnlyKeys(item, ['alg', 'type']) &&
        typeof item.alg === 'number' &&
        Number.isSafeInteger(item.alg) &&
        item.type === 'public-key',
    )
  )
    return false;
  if (
    value.timeout !== undefined &&
    (typeof value.timeout !== 'number' ||
      !Number.isSafeInteger(value.timeout) ||
      value.timeout < 1 ||
      value.timeout > 120_000)
  )
    return false;
  if (
    value.attestation !== undefined &&
    value.attestation !== 'none' &&
    value.attestation !== 'direct' &&
    value.attestation !== 'enterprise'
  )
    return false;
  return true;
};

const decode = (value: string): ArrayBuffer => {
  if (!/^[A-Za-z0-9_-]+$/.test(value))
    throw new Error('Invalid WebAuthn option');
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/');
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
  let binary: string;
  try {
    binary = atob(padded);
  } catch {
    throw new Error('Invalid WebAuthn option');
  }
  if (binary.length > 16_384) throw new Error('WebAuthn option is too large');
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  binary.split('').forEach((character, index) => {
    bytes[index] = character.charCodeAt(0);
  });
  return bytes.buffer;
};

const isAuthenticatorTransport = (
  value: string,
): value is AuthenticatorTransport =>
  value === 'ble' ||
  value === 'hybrid' ||
  value === 'internal' ||
  value === 'nfc' ||
  value === 'usb';

const register = async (context: RegistrationContext): Promise<void> => {
  const optionsResponse = await apiClient.post<unknown, RegistrationContext>(
    '/users/me/vault/webauthn/credentials/registration/options',
    context,
  );
  if (!isOptions(optionsResponse))
    throw new Error('Invalid WebAuthn registration options');
  const credential = await navigator.credentials.create({
    publicKey: {
      challenge: decode(optionsResponse.challenge),
      rp: optionsResponse.rp,
      user: {
        id: decode(optionsResponse.user.id),
        name: optionsResponse.user.name,
        displayName: optionsResponse.user.displayName,
      },
      pubKeyCredParams: [...optionsResponse.pubKeyCredParams],
      timeout: optionsResponse.timeout,
      attestation: optionsResponse.attestation,
      authenticatorSelection: optionsResponse.authenticatorSelection,
      excludeCredentials: optionsResponse.excludeCredentials?.map((item) => ({
        id: decode(item.id),
        type: 'public-key' as const,
        ...(item.transports === undefined
          ? {}
          : {
              transports: item.transports.every(isAuthenticatorTransport)
                ? [...item.transports]
                : (() => {
                    throw new Error('Invalid WebAuthn transport');
                  })(),
            }),
      })),
      extensions: { prf: {} },
    },
  });
  const serialized = allowlistedWebauthnDto.serializeRegistration(credential);
  await apiClient.post<
    unknown,
    {
      readonly vaultId: string;
      readonly deviceId: string;
      readonly challenge: string;
      readonly credential: typeof serialized;
    }
  >('/users/me/vault/webauthn/credentials/registration/verify', {
    ...context,
    challenge: optionsResponse.challenge,
    credential: serialized,
  });
};

export const webauthnCredentials = Object.freeze({
  register,
  verifyAuthentication,
});
