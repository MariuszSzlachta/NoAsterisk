import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError } from '#shared/api';

import { useRegisterMutation } from './useRegisterMutation';

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
  setAccessToken: vi.fn(),
  setAccountContext: vi.fn(),
  setRegisterSubmitting: vi.fn(),
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

vi.mock('#features/auth/store/useAuthStore', () => ({
  useAuthStore: (
    selector: (state: {
      setRegisterSubmitting: typeof mocks.setRegisterSubmitting;
    }) => unknown,
  ) => selector({ setRegisterSubmitting: mocks.setRegisterSubmitting }),
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

describe('useRegisterMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('registers the account and configures its authenticated context', async () => {
    mocks.post.mockResolvedValue(response);
    const { result } = renderHook(() => useRegisterMutation());

    await act(() =>
      result.current.mutateAsync({
        email: 'user@example.com',
        password: 'P@ssw0rd',
        inviteCode: 'INVITE',
      }),
    );

    expect(mocks.post).toHaveBeenCalledWith(
      '/auth/register',
      {
        email: 'user@example.com',
        password: 'P@ssw0rd',
        inviteCode: 'INVITE',
      },
      { skipAuth: true },
    );
    expect(mocks.setAccessToken).toHaveBeenCalledWith('access-token');
    expect(mocks.setAccountContext).toHaveBeenCalledWith(
      'user-1',
      'workspace-1',
    );
    expect(mocks.setRegisterSubmitting.mock.calls).toEqual([[true], [false]]);
    expect(result.current.error).toBeUndefined();
  });

  it('maps a registration conflict and always clears the submitting state', async () => {
    mocks.post.mockRejectedValue(
      new ApiError('Bad request', 400, { message: 'Registration failed' }),
    );
    const { result } = renderHook(() => useRegisterMutation());

    await act(async () => {
      await expect(
        result.current.mutateAsync({
          email: 'user@example.com',
          password: 'P@ssw0rd',
        }),
      ).rejects.toThrow('Bad request');
    });

    expect(result.current.error).toBe('auth.register.emailConflict');
    expect(result.current.isLoading).toBe(false);
    expect(mocks.setRegisterSubmitting).toHaveBeenLastCalledWith(false);
  });
});
