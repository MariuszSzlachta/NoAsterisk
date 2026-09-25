import type { Response } from 'express';

import { refreshTokenCookie } from './refresh-token-cookie';

describe('refreshTokenCookie', () => {
  it('reads the refresh token without being sensitive to cookie order', () => {
    expect(
      refreshTokenCookie.read(
        'session=ignored; budget_refresh_token=refresh-value; theme=dark',
      ),
    ).toBe('refresh-value');
    expect(refreshTokenCookie.read(undefined)).toBeUndefined();
  });

  it('sets the security and scope attributes centrally', () => {
    const response: Pick<Response, 'cookie'> = { cookie: jest.fn() };

    refreshTokenCookie.set(response, 'refresh-value');

    expect(response.cookie).toHaveBeenCalledWith(
      'budget_refresh_token',
      'refresh-value',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'strict',
        path: '/api/auth/refresh',
      }),
    );
  });

  it('clears the same cookie path used when setting it', () => {
    const response: Pick<Response, 'clearCookie'> = {
      clearCookie: jest.fn(),
    };

    refreshTokenCookie.clear(response);

    expect(response.clearCookie).toHaveBeenCalledWith('budget_refresh_token', {
      path: '/api/auth/refresh',
    });
  });
});
