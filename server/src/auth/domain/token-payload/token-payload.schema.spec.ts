import { parseTokenPayload } from './token-payload.schema';

describe('parseTokenPayload', () => {
  it.each([
    undefined,
    null,
    {},
    { sub: 'u', workspaceId: 'w', role: 'Member' },
    {
      sub: 'u',
      workspaceId: 'w',
      role: 'Member',
      tokenVersion: 1.5,
    },
    {
      sub: 'u',
      workspaceId: 'w',
      role: 'Member',
      tokenVersion: 1,
      unexpected: true,
    },
  ])('rejects malformed claims: %j', (value) => {
    expect(parseTokenPayload(value)).toBeUndefined();
  });

  it('accepts only the validated claim contract', () => {
    expect(
      parseTokenPayload({
        sub: 'u',
        workspaceId: 'w',
        role: 'Member',
        tokenVersion: 1,
        authTime: 10,
        amr: 'password',
      }),
    ).toEqual({
      sub: 'u',
      workspaceId: 'w',
      role: 'Member',
      tokenVersion: 1,
      authTime: 10,
      amr: 'password',
    });
  });
});
