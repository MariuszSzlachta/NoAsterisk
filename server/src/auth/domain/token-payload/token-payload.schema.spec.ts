import { parseTokenPayload } from '@auth/domain/token-payload/token-payload.schema';

describe('parseTokenPayload', () => {
  it('accepts verified JWT standard timestamps without weakening unknown claim rejection', () => {
    expect(
      parseTokenPayload({
        sub: 'u',
        workspaceId: 'w',
        role: 'Member',
        tokenVersion: 0,
        iat: 1,
        exp: 2,
      }),
    ).toMatchObject({ sub: 'u', tokenVersion: 0 });
    expect(
      parseTokenPayload({
        sub: 'u',
        workspaceId: 'w',
        role: 'Member',
        tokenVersion: 0,
        iat: '1',
      }),
    ).toBeUndefined();
  });
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
