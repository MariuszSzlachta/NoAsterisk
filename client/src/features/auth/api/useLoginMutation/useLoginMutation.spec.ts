import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '#shared/api';

import { useLoginMutation } from './useLoginMutation';

const mocks = vi.hoisted(() => ({
  clearHandoff: vi.fn(),
  post: vi.fn(),
  setAccessToken: vi.fn(),
  setAccountContext: vi.fn(),
  setLoginSubmitting: vi.fn(),
}));

vi.mock('#shared/api', () => ({
  apiClient: { post: mocks.post },
  ApiError: class ApiError extends Error {
    constructor(
      message: string,
      readonly status: number,
      readonly body?: unknown,
    ) {
      super(message);
    }
  },
}));

vi.mock('#shared/api/auth-tokens', () => ({
  authTokens: { setAccessToken: mocks.setAccessToken },
}));

vi.mock('#shared/adapters/persistence', () => ({
  encryptedPersistence: { setAccountContext: mocks.setAccountContext },
}));

vi.mock('#shared/adapters/webauthn/passkey-unlock-handoff', () => ({
  passkeyUnlockHandoff: { clear: mocks.clearHandoff },
}));

vi.mock('#features/auth/store/useAuthStore', () => ({
  useAuthStore: (
    selector: (state: {
      setLoginSubmitting: typeof mocks.setLoginSubmitting;
    }) => unknown,
  ) => selector({ setLoginSubmitting: mocks.setLoginSubmitting }),
}));

const response = {
  accessToken: 'access-token',
  user: {
    id: 'user-1',
    email: 'user@example.com',
    role: 'Member',
    workspaceId: 'workspace-1',
  },
};

describe('useLoginMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('completes login and configures the authenticated client context', async () => {
    mocks.post.mockResolvedValue(response);
    const { result } = renderHook(() => useLoginMutation());

    await act(() =>
      result.current.mutateAsync({
        email: 'user@example.com',
        password: 'password',
      }),
    );

    expect(mocks.clearHandoff).toHaveBeenCalledOnce();
    expect(mocks.post).toHaveBeenCalledWith(
      '/auth/login',
      { email: 'user@example.com', password: 'password' },
      { skipAuth: true },
    );
    expect(mocks.setAccessToken).toHaveBeenCalledWith('access-token');
    expect(mocks.setAccountContext).toHaveBeenCalledWith(
      'user-1',
      'workspace-1',
    );
    expect(mocks.setLoginSubmitting.mock.calls).toEqual([[true], [false]]);
    expect(result.current.error).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });

  it('exposes the credentials error after an unauthorized response', async () => {
    mocks.post.mockRejectedValue(new ApiError('Unauthorized', 401));
    const { result } = renderHook(() => useLoginMutation());

    await act(async () => {
      await expect(
        result.current.mutateAsync({
          email: 'user@example.com',
          password: 'wrong',
        }),
      ).rejects.toThrow('Unauthorized');
    });

    expect(result.current.error).toBe('auth.login.invalidCredentials');
    expect(result.current.isLoading).toBe(false);
    expect(mocks.setLoginSubmitting).toHaveBeenLastCalledWith(false);
  });
});
