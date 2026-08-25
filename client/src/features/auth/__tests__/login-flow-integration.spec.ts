import { act, renderHook } from '@testing-library/react';
import type { ChangeEvent, FormEvent } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '#features/auth/store/useAuthStore';
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
    useAuthStore.setState({
      loginForm: { email: '', password: '' },
      loginErrors: {},
      registerForm: { email: '', password: '', confirmPassword: '' },
      registerErrors: {},
      serverError: undefined,
      isSubmitting: false,
    });
  });

  it('flow: type credentials → submit → token stored → navigate', async () => {
    mockPost.mockResolvedValue(buildAuthResponse());

    const { result } = renderHook(() => useLoginForm());

    // Step 1: Fill email
    act(() => {
      result.current.handleEmailChange(buildChangeEvent('user@budget.pl'));
    });
    expect(result.current.values.email).toBe('user@budget.pl');

    // Step 2: Fill password
    act(() => {
      result.current.handlePasswordChange(buildChangeEvent('securepass123'));
    });
    expect(result.current.values.password).toBe('securepass123');

    // Step 3: Submit
    await act(async () => {
      result.current.handleSubmit(buildSubmitEvent());
    });

    // Assertions
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

    // Fill form
    act(() => {
      result.current.handleEmailChange(buildChangeEvent('user@budget.pl'));
      result.current.handlePasswordChange(buildChangeEvent('wrongpass1'));
    });

    // First submit — fails
    await act(async () => {
      result.current.handleSubmit(buildSubmitEvent());
    });

    expect(result.current.serverError).toBe('auth.login.invalidCredentials');
    expect(mockNavigate).not.toHaveBeenCalled();

    // Fix password
    act(() => {
      result.current.handlePasswordChange(buildChangeEvent('correctpass'));
    });

    // Server error clears on typing
    expect(result.current.serverError).toBeUndefined();

    // Second submit — succeeds
    await act(async () => {
      result.current.handleSubmit(buildSubmitEvent());
    });

    expect(mockSetAccessToken).toHaveBeenCalledWith('jwt-token-123');
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('flow: type email → see error → clear error by typing', () => {
    const { result } = renderHook(() => useLoginForm());

    // Submit empty → errors
    act(() => {
      result.current.handleSubmit(buildSubmitEvent());
    });
    expect(result.current.errors.email).toBe('auth.validation.emailRequired');

    // Start typing → error clears
    act(() => {
      result.current.handleEmailChange(buildChangeEvent('a'));
    });
    expect(result.current.errors.email).toBeUndefined();
  });
});
