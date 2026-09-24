import { vaultProtocol } from '#shared/adapters/vault-protocol/vault-protocol';
import { allowlistedWebauthnDto } from '#shared/adapters/webauthn/allowlisted-webauthn-dto';

interface PasskeyPrfInput {
  readonly challenge: Uint8Array;
  readonly salt: Uint8Array;
  readonly credentialIds?: ReadonlyArray<Uint8Array>;
  readonly rpId?: string;
  readonly requirePrf?: boolean;
}


const toBuffer = (value: Uint8Array): ArrayBuffer => {
  const copy = new Uint8Array(value.length);
  copy.set(value);
  return copy.buffer;
};

const run = async (input: PasskeyPrfInput): Promise<{
  readonly credentialId: string;
  readonly prfKey: CryptoKey | undefined;
  readonly assertion: ReturnType<typeof allowlistedWebauthnDto.serializeAssertion>;
}> => {
  if (typeof navigator.credentials?.get !== 'function')
    throw new Error('Passkey PRF is unavailable');
  const credential = await navigator.credentials.get({
    publicKey: {
      challenge: toBuffer(input.challenge),
      rpId: input.rpId,
      userVerification: 'required',
      allowCredentials: input.credentialIds?.map((id) => ({
        id: toBuffer(id),
        type: 'public-key',
      })),
      extensions: {
        prf: { eval: { first: toBuffer(input.salt) } },
      },
    },
  });
  if (!(credential instanceof PublicKeyCredential))
    throw new Error('Passkey PRF ceremony was cancelled');
  const outputs = credential.getClientExtensionResults().prf?.results;
  const first = outputs?.first;
  if (!(first instanceof ArrayBuffer) || first.byteLength !== 32) {
    if (input.requirePrf === false)
      return {
        credentialId: credential.id,
        prfKey: undefined,
        assertion: allowlistedWebauthnDto.serializeAssertion(credential),
      };
    throw new Error('Passkey PRF is not supported by this credential');
  }
  return {
    credentialId: credential.id,
    prfKey: await vaultProtocol.importPrfOutput(new Uint8Array(first)),
    assertion: allowlistedWebauthnDto.serializeAssertion(credential),
  };
};

export const passkeyPrf = Object.freeze({ run });
