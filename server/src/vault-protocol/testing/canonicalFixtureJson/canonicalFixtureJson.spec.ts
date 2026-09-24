import { canonicalFixtureJson } from '@vault-protocol/testing/canonicalFixtureJson';
describe('canonicalFixtureJson', () => {
  it('sorts recursively without reordering arrays', () => {
    expect(
      JSON.stringify(canonicalFixtureJson({ z: [{ b: 1, a: 2 }], a: null })),
    ).toBe('{"a":null,"z":[{"a":2,"b":1}]}');
  });
});
