import { isRotationIdentifier } from '@vault-protocol/domain/value-objects/vault-rotation-transcript/isRotationIdentifier';
describe('isRotationIdentifier', () => {
  it.each([
    ['', false],
    ['id', true],
    ['a'.repeat(128), true],
    ['a'.repeat(129), false],
  ])('should enforce bounded identifiers for %s', (value, expected) => {
    expect(isRotationIdentifier(value)).toBe(expected);
  });
});
