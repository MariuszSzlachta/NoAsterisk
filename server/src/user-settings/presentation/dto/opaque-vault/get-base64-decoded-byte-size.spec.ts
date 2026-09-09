import { getBase64DecodedByteSize } from '@user-settings/presentation/dto/opaque-vault/get-base64-decoded-byte-size';

describe('getBase64DecodedByteSize', () => {
  it.each([
    ['YQ==', 1],
    ['YWI=', 2],
    ['YWJj', 3],
  ])('returns decoded size for %s', (value, expected) => {
    expect(getBase64DecodedByteSize(value)).toBe(expected);
  });
});
