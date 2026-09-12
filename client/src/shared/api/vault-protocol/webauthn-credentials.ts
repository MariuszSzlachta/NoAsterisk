import { apiClient } from '#shared/api';
import { allowlistedWebauthnDto } from '#shared/adapters/webauthn/allowlisted-webauthn-dto';

interface RegistrationContext {
  readonly vaultId: string;
  readonly deviceId: string;
}

const verifyAuthentication = async (input: {
  readonly vaultId: string;
  readonly deviceId: string;
  readonly challenge: string;
  readonly assertion: ReturnType<typeof allowlistedWebauthnDto.serializeAssertion>;
}): Promise<void> => {
  await apiClient.post('/users/me/vault/webauthn/credentials/authentication/verify', input);
};

interface RegistrationOptionsResponse {
  readonly challenge: string;
  readonly rp: { readonly name: string; readonly id: string };
  readonly user: { readonly id: string; readonly name: string; readonly displayName: string };
  readonly pubKeyCredParams: ReadonlyArray<{ readonly alg: number; readonly type: 'public-key' }>;
  readonly timeout?: number;
  readonly attestation?: 'none' | 'direct' | 'enterprise';
  readonly authenticatorSelection?: AuthenticatorSelectionCriteria;
  readonly excludeCredentials?: ReadonlyArray<{ readonly id: string; readonly transports?: ReadonlyArray<string> }>;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isOptions = (value: unknown): value is RegistrationOptionsResponse => {
  if (!isRecord(value) || typeof value.challenge !== 'string') return false;
  if (!isRecord(value.rp) || typeof value.rp.name !== 'string' || typeof value.rp.id !== 'string') return false;
  if (!isRecord(value.user) || typeof value.user.id !== 'string' || typeof value.user.name !== 'string' || typeof value.user.displayName !== 'string') return false;
  return Array.isArray(value.pubKeyCredParams) && value.pubKeyCredParams.every(
    (item) => isRecord(item) && typeof item.alg === 'number' && item.type === 'public-key',
  );
};

const decode = (value: string): ArrayBuffer => {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error('Invalid WebAuthn option');
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
  binary.split('').forEach((character, index) => { bytes[index] = character.charCodeAt(0); });
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
  if (!isOptions(optionsResponse)) throw new Error('Invalid WebAuthn registration options');
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
              transports: item.transports.filter(isAuthenticatorTransport),
            }),
      })),
      extensions: { prf: {} },
    },
  });
  const serialized = allowlistedWebauthnDto.serializeRegistration(credential);
  await apiClient.post<unknown, {
    readonly vaultId: string;
    readonly deviceId: string;
    readonly challenge: string;
    readonly credential: typeof serialized;
  }>('/users/me/vault/webauthn/credentials/registration/verify', {
    ...context,
    challenge: optionsResponse.challenge,
    credential: serialized,
  });
};

export const webauthnCredentials = Object.freeze({ register, verifyAuthentication });
