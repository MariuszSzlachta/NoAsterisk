const encodeUserHandle = (userId: string): string =>
  Buffer.from(userId, 'utf8').toString('base64url');

const matches = (userId: string, userHandle: string | undefined): boolean =>
  userHandle === undefined || userHandle === encodeUserHandle(userId);

export const webauthnUserHandle = Object.freeze({ matches });
