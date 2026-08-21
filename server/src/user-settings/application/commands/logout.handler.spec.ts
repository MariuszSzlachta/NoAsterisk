import { LogoutHandler } from './logout.handler';

describe('LogoutHandler', () => {
  let handler: LogoutHandler;

  beforeEach(() => {
    handler = new LogoutHandler();
  });

  it('returns success for valid userId', async () => {
    const result = await handler.execute({ userId: 'user-1' });

    expect(result).toEqual({ success: true });
  });

  it('throws when userId is empty', async () => {
    await expect(handler.execute({ userId: '' })).rejects.toThrow(
      'User ID is required for logout',
    );
  });
});
