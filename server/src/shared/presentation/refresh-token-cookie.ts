import type { CookieOptions, Response } from 'express';

const COOKIE_NAME = 'budget_refresh_token';
const COOKIE_PATH = '/api/auth/refresh';
const COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  sameSite: 'strict',
  secure: process.env.NODE_ENV === 'production',
  path: COOKIE_PATH,
};

const readCookie = (cookieHeader: string | undefined): string | undefined =>
  cookieHeader
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);

export const refreshTokenCookie = {
  clear: (response: Response): void => {
    response.clearCookie(COOKIE_NAME, { path: COOKIE_PATH });
  },
  read: readCookie,
  set: (response: Response, token: string): void => {
    response.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);
  },
};
