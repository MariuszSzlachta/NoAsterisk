import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useLoginMutation } from '#features/auth/api/useLoginMutation/useLoginMutation';
import { useRegisterMutation } from '#features/auth/api/useRegisterMutation/useRegisterMutation';
import { useAuthStore } from '#features/auth/store/useAuthStore';

// ─── Mock Setup ──────────────────────────────────────────────────

const mockPost = vi.fn();
const mockSetAccessToken = vi.fn();

vi.mock('#shared/api', () => ({
  apiClient: {
    post: (...args: unknown[]) => mockPost(...args),
  },
  ApiError: class ApiError extends Error {
    readonly status: number;
    readonly body: unknown;
    constructor(message: string, status: number, body?: unknown) {
      super(message);
      this.name = 'ApiError';
      this.status = status;
      this.body = body;
    }
  },
}));

vi.mock('#shared/api/auth-tokens', () => ({
  authTokens: {
    setAccessToken: (...args: unknown[]) => mockSetAccessToken(...args),
  },
}));

// ─── Test Builders ───────────────────────────────────────────────

const buildAuthResponse = () => ({
  accessToken: 'test-access-token',
  refreshToken: 'test-refresh-token',
  user: { id: 'u-1', email: 'test@example.com', role: 'Member' as const, workspaceId: 'ws-1' },
});

// ─── Tests ───────────────────────────────────────────────────────

describe('useLoginMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      loginForm: { email: '', password: '' },
      loginErrors: {},
      registerForm: { email: '', password: '', confirmPassword: '' },
      registerErrors: {},
      serverError: undefined,
      isSubmitting: false,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls POST /auth/login with credentials and skipAuth', async () => {
    const response = buildAuthResponse();
    mockPost.mockResolvedValue(response);

    const { result } = renderHook(() => useLoginMutation());

    await act(async () => {
      await result.current.mutateAsync({ email: 'test@example.com', password: 'pass123' });
    });

    expect(mockPost).toHaveBeenCalledWith(
      '/auth/login',
      { email: 'test@example.com', password: 'pass123' },
      { skipAuth: true },
    );
  });

  it('sets access token on successful login', async () => {
    const response = buildAuthResponse();
    mockPost.mockResolvedValue(response);

    const { result } = renderHook(() => useLoginMutation());

    await act(async () => {
      await result.current.mutateAsync({ email: 'test@example.com', password: 'pass123' });
    });

    expect(mockSetAccessToken).toHaveBeenCalledWith('test-access-token');
  });

  it('returns auth response on success', async () => {
    const response = buildAuthResponse();
    mockPost.mockResolvedValue(response);

    const { result } = renderHook(() => useLoginMutation());

    let returnedResponse;
    await act(async () => {
      returnedResponse = await result.current.mutateAsync({ email: 'a@b.com', password: 'pwd12345' });
    });

    expect(returnedResponse).toEqual(response);
  });

  it('sets isLoading to true during request', async () => {
    let resolvePromise: (value: unknown) => void;
    mockPost.mockReturnValue(new Promise((resolve) => { resolvePromise = resolve; }));

    const { result } = renderHook(() => useLoginMutation());

    act(() => {
      void result.current.mutateAsync({ email: 'a@b.com', password: 'pass1234' });
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolvePromise!(buildAuthResponse());
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('sets invalidCredentials error on 401', async () => {
    const { ApiError } = await import('#shared/api');
    mockPost.mockRejectedValue(new ApiError('Unauthorized', 401));

    const { result } = renderHook(() => useLoginMutation());

    await act(async () => {
      await result.current.mutateAsync({ email: 'a@b.com', password: 'wrong' }).catch(() => {});
    });

    expect(result.current.error).toBe('auth.login.invalidCredentials');
    expect(result.current.isLoading).toBe(false);
  });

  it('sets generic error on non-401 errors', async () => {
    const { ApiError } = await import('#shared/api');
    mockPost.mockRejectedValue(new ApiError('Server Error', 500));

    const { result } = renderHook(() => useLoginMutation());

    await act(async () => {
      await result.current.mutateAsync({ email: 'a@b.com', password: 'pass1234' }).catch(() => {});
    });

    expect(result.current.error).toBe('auth.login.genericError');
  });

  it('sets generic error on network errors', async () => {
    mockPost.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useLoginMutation());

    await act(async () => {
      await result.current.mutateAsync({ email: 'a@b.com', password: 'pass1234' }).catch(() => {});
    });

    expect(result.current.error).toBe('auth.login.genericError');
  });

  it('resets state on reset call', async () => {
    const { ApiError } = await import('#shared/api');
    mockPost.mockRejectedValue(new ApiError('Unauthorized', 401));

    const { result } = renderHook(() => useLoginMutation());

    await act(async () => {
      await result.current.mutateAsync({ email: 'a@b.com', password: 'x' }).catch(() => {});
    });

    expect(result.current.error).toBeDefined();

    act(() => {
      result.current.reset();
    });

    expect(result.current.error).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });
});

describe('useRegisterMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      loginForm: { email: '', password: '' },
      loginErrors: {},
      registerForm: { email: '', password: '', confirmPassword: '' },
      registerErrors: {},
      serverError: undefined,
      isSubmitting: false,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('calls POST /auth/register with body and skipAuth', async () => {
    const response = buildAuthResponse();
    mockPost.mockResolvedValue(response);

    const { result } = renderHook(() => useRegisterMutation());

    await act(async () => {
      await result.current.mutateAsync({ email: 'new@user.com', password: 'password123' });
    });

    expect(mockPost).toHaveBeenCalledWith(
      '/auth/register',
      { email: 'new@user.com', password: 'password123' },
      { skipAuth: true },
    );
  });

  it('sets access token on successful registration', async () => {
    const response = buildAuthResponse();
    mockPost.mockResolvedValue(response);

    const { result } = renderHook(() => useRegisterMutation());

    await act(async () => {
      await result.current.mutateAsync({ email: 'new@user.com', password: 'password123' });
    });

    expect(mockSetAccessToken).toHaveBeenCalledWith('test-access-token');
  });

  it('sets emailConflict error on 409', async () => {
    const { ApiError } = await import('#shared/api');
    mockPost.mockRejectedValue(new ApiError('Conflict', 409));

    const { result } = renderHook(() => useRegisterMutation());

    await act(async () => {
      await result.current.mutateAsync({ email: 'existing@user.com', password: 'pass1234' }).catch(() => {});
    });

    expect(result.current.error).toBe('auth.register.emailConflict');
    expect(result.current.isLoading).toBe(false);
  });

  it('sets generic error on non-409 errors', async () => {
    const { ApiError } = await import('#shared/api');
    mockPost.mockRejectedValue(new ApiError('Server Error', 500));

    const { result } = renderHook(() => useRegisterMutation());

    await act(async () => {
      await result.current.mutateAsync({ email: 'new@user.com', password: 'pass1234' }).catch(() => {});
    });

    expect(result.current.error).toBe('auth.register.genericError');
  });

  it('sets generic error on network errors', async () => {
    mockPost.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useRegisterMutation());

    await act(async () => {
      await result.current.mutateAsync({ email: 'new@user.com', password: 'pass1234' }).catch(() => {});
    });

    expect(result.current.error).toBe('auth.register.genericError');
  });

  it('resets state on reset call', async () => {
    const { ApiError } = await import('#shared/api');
    mockPost.mockRejectedValue(new ApiError('Conflict', 409));

    const { result } = renderHook(() => useRegisterMutation());

    await act(async () => {
      await result.current.mutateAsync({ email: 'a@b.com', password: 'x' }).catch(() => {});
    });

    expect(result.current.error).toBeDefined();

    act(() => {
      result.current.reset();
    });

    expect(result.current.error).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
  });
});
