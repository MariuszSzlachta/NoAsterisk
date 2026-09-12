import { vaultProtocol } from '#shared/adapters/vault-protocol/vault-protocol';

const VMK_BYTES = 32;
const CHECKSUM_BYTES = 4;
const BYTE_HEX_LENGTH = 2;
const RECOVERY_HEX_LENGTH = (VMK_BYTES + CHECKSUM_BYTES) * BYTE_HEX_LENGTH;

const toHex = (bytes: Uint8Array): string =>
  Array.from(bytes, (byte) =>
    byte.toString(16).padStart(BYTE_HEX_LENGTH, '0'),
  ).join('');

const fromHex = (value: string): Uint8Array<ArrayBuffer> => {
  if (!/^[0-9a-f]+$/i.test(value) || value.length % BYTE_HEX_LENGTH !== 0)
    throw new Error('Invalid recovery code');
  const bytes = new Uint8Array(new ArrayBuffer(value.length / BYTE_HEX_LENGTH));
  Array.from({ length: bytes.length }, (_, index) => {
    bytes[index] = Number.parseInt(
      value.slice(index * BYTE_HEX_LENGTH, (index + 1) * BYTE_HEX_LENGTH),
      16,
    );
  });
  return bytes;
};

const checksum = async (vmk: Uint8Array): Promise<Uint8Array<ArrayBuffer>> => {
  const digest = new Uint8Array(
    await crypto.subtle.digest('SHA-256', vmk.slice().buffer),
  );
  const result = new Uint8Array(new ArrayBuffer(CHECKSUM_BYTES));
  result.set(digest.slice(0, CHECKSUM_BYTES));
  return result;
};

const create = async (): Promise<{
  readonly code: string;
  readonly vmk: Uint8Array;
}> => {
  const vmk = vaultProtocol.generateVmk();
  const check = await checksum(vmk);
  return { code: toHex(vmk) + toHex(check), vmk };
};

const restore = async (code: string): Promise<Uint8Array<ArrayBuffer>> => {
  if (code.length !== RECOVERY_HEX_LENGTH)
    throw new Error('Invalid recovery code');
  const bytes = fromHex(code);
  const vmk = bytes.slice(0, VMK_BYTES);
  const expected = await checksum(vmk);
  const received = bytes.slice(VMK_BYTES);
  if (toHex(expected) !== toHex(received))
    throw new Error('Invalid recovery code');
  return vmk;
};

export const recoveryCode = Object.freeze({ create, restore });
