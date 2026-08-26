import { act, renderHook } from '@testing-library/react';
import type { ChangeEvent, FormEvent } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useLoginForm } from '#features/auth/ui/hooks/useLoginForm/useLoginForm';

// ─── Mock Setup ──────────────────────────────────────────────────

const mockNavigate = vi.fn();
const mockPost = vi.fn();
const mockSetAccessToken = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

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

// ─── Helpers ─────────────────────────────────────────────────────

const buildChangeEvent = (value: string): ChangeEvent<HTMLInputElement> =>
  ({ target: { value } } as ChangeEvent<HTMLInputElement>);

const buildSubmitEvent = (): FormEvent =>
  ({ preventDefault: vi.fn() } as unknown as FormEvent);

const buildAuthResponse = () => ({
  accessToken: 'jwt-token-123',
  refreshToken: 'refresh-token-456',
  user: { id: 'u-1', email: 'user@budget.pl', role: 'Member' as const, workspaceId: 'ws-1' },
});

// ─── Tests ───────────────────────────────────────────────────────

describe('Login flow — integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('flow: type credentials → submit → token stored → navigate', async () => {
    mockPost.mockResolvedValue(buildAuthResponse());

    const { result } = renderHook(() => useLoginForm());

    act(() => {
      result.current.handleEmailChange(buildChangeEvent('user@budget.pl'));
    });
    expect(result.current.values.email).toBe('user@budget.pl');

    act(() => {
      result.current.handlePasswordChange(buildChangeEvent('securepass123'));
    });
    expect(result.current.values.password).toBe('securepass123');

    await act(async () => {
      result.current.handleSubmit(buildSubmitEvent());
    });

    expect(mockPost).toHaveBeenCalledWith(
      '/auth/login',
      { email: 'user@budget.pl', password: 'securepass123' },
      { skipAuth: true },
    );
    expect(mockSetAccessToken).toHaveBeenCalledWith('jwt-token-123');
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    expect(result.current.errors).toEqual({});
    expect(result.current.serverError).toBeUndefined();
  });

  it('flow: type invalid email → submit → shows validation error → no API call', () => {
    const { result } = renderHook(() => useLoginForm());

    act(() => {
      result.current.handleEmailChange(buildChangeEvent('not-an-email'));
      result.current.handlePasswordChange(buildChangeEvent('password123'));
    });

    act(() => {
      result.current.handleSubmit(buildSubmitEvent());
    });

    expect(result.current.errors.email).toBe('auth.validation.emailInvalid');
    expect(mockPost).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('flow: submit → 401 → shows server error → fix and resubmit', async () => {
    const { ApiError } = await import('#shared/api');
    mockPost.mockRejectedValueOnce(new ApiError('Unauthorized', 401));
    mockPost.mockResolvedValueOnce(buildAuthResponse());

    const { result } = renderHook(() => useLoginForm());

    act(() => {
      result.current.handleEmailChange(buildChangeEvent('user@budget.pl'));
      result.current.handlePasswordChange(buildChangeEvent('wrongpass1'));
    });

    await act(async () => {
      result.current.handleSubmit(buildSubmitEvent());
    });

    expect(result.current.serverError).toBe('auth.login.invalidCredentials');
    expect(mockNavigate).not.toHaveBeenCalled();

    act(() => {
      result.current.handlePasswordChange(buildChangeEvent('correctpass'));
    });

    await act(async () => {
      result.current.handleSubmit(buildSubmitEvent());
    });

    expect(mockSetAccessToken).toHaveBeenCalledWith('jwt-token-123');
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('flow: type email → see error → clear error by typing', () => {
    const { result } = renderHook(() => useLoginForm());

    act(() => {
      result.current.handleSubmit(buildSubmitEvent());
    });
    expect(result.current.errors.email).toBe('auth.validation.emailRequired');

    act(() => {
      result.current.handleEmailChange(buildChangeEvent('a'));
    });
    expect(result.current.errors.email).toBeUndefined();
  });

  it('canonicalizes email before sending to API', async () => {
    mockPost.mockResolvedValue(buildAuthResponse());

    const { result } = renderHook(() => useLoginForm());

    act(() => {
      result.current.handleEmailChange(buildChangeEvent('  User@Budget.PL  '));
      result.current.handlePasswordChange(buildChangeEvent('securepass123'));
    });

    await act(async () => {
      result.current.handleSubmit(buildSubmitEvent());
      await Promise.resolve();
    });

    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(mockPost).toHaveBeenCalledWith(
      '/auth/login',
      expect.objectContaining({ email: 'user@budget.pl' }),
      { skipAuth: true },
    );
  });

  it('clears form values after successful login', async () => {
    mockPost.mockResolvedValue(buildAuthResponse());

    const { result } = renderHook(() => useLoginForm());

    act(() => {
      result.current.handleEmailChange(buildChangeEvent('user@budget.pl'));
      result.current.handlePasswordChange(buildChangeEvent('securepass123'));
    });

    await act(async () => {
      result.current.handleSubmit(buildSubmitEvent());
    });

    expect(result.current.values.email).toBe('');
    expect(result.current.values.password).toBe('');
  });
});
