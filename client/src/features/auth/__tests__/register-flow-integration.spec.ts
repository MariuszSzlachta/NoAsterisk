import { act, renderHook } from '@testing-library/react';
import type { ChangeEvent, FormEvent } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '#features/auth/store/useAuthStore';
import { useRegisterForm } from '#features/auth/ui/hooks/useRegisterForm/useRegisterForm';

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
  accessToken: 'new-user-token',
  refreshToken: 'refresh-789',
  user: { id: 'u-new', email: 'new@user.com', role: 'Member' as const, workspaceId: 'ws-2' },
});

// ─── Tests ───────────────────────────────────────────────────────

describe('Register flow — integration', () => {
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

  it('flow: fill form → submit → token stored → navigate', async () => {
    mockPost.mockResolvedValue(buildAuthResponse());

    const { result } = renderHook(() => useRegisterForm());

    // Step 1: Fill all fields
    act(() => {
      result.current.handleEmailChange(buildChangeEvent('new@user.com'));
      result.current.handlePasswordChange(buildChangeEvent('strongpass123'));
      result.current.handleConfirmPasswordChange(buildChangeEvent('strongpass123'));
    });

    // Step 2: Submit
    await act(async () => {
      result.current.handleSubmit(buildSubmitEvent());
    });

    // Assertions
    expect(mockPost).toHaveBeenCalledWith(
      '/auth/register',
      { email: 'new@user.com', password: 'strongpass123' },
      { skipAuth: true },
    );
    expect(mockSetAccessToken).toHaveBeenCalledWith('new-user-token');
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    expect(result.current.errors).toEqual({});
  });

  it('flow: mismatched passwords → validation error → no API call', () => {
    const { result } = renderHook(() => useRegisterForm());

    act(() => {
      result.current.handleEmailChange(buildChangeEvent('new@user.com'));
      result.current.handlePasswordChange(buildChangeEvent('password123'));
      result.current.handleConfirmPasswordChange(buildChangeEvent('different'));
    });

    act(() => {
      result.current.handleSubmit(buildSubmitEvent());
    });

    expect(result.current.errors.confirmPassword).toBe('auth.validation.passwordsMismatch');
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('flow: submit → 409 → shows conflict error', async () => {
    const { ApiError } = await import('#shared/api');
    mockPost.mockRejectedValue(new ApiError('Conflict', 409));

    const { result } = renderHook(() => useRegisterForm());

    act(() => {
      result.current.handleEmailChange(buildChangeEvent('existing@user.com'));
      result.current.handlePasswordChange(buildChangeEvent('password123'));
      result.current.handleConfirmPasswordChange(buildChangeEvent('password123'));
    });

    await act(async () => {
      result.current.handleSubmit(buildSubmitEvent());
    });

    expect(result.current.serverError).toBe('auth.register.emailConflict');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('flow: submit → 500 → shows generic error', async () => {
    const { ApiError } = await import('#shared/api');
    mockPost.mockRejectedValue(new ApiError('Internal', 500));

    const { result } = renderHook(() => useRegisterForm());

    act(() => {
      result.current.handleEmailChange(buildChangeEvent('new@user.com'));
      result.current.handlePasswordChange(buildChangeEvent('password123'));
      result.current.handleConfirmPasswordChange(buildChangeEvent('password123'));
    });

    await act(async () => {
      result.current.handleSubmit(buildSubmitEvent());
    });

    expect(result.current.serverError).toBe('auth.register.genericError');
  });

  it('flow: server error clears when user types in any field', async () => {
    const { ApiError } = await import('#shared/api');
    mockPost.mockRejectedValue(new ApiError('Conflict', 409));

    const { result } = renderHook(() => useRegisterForm());

    // Fill and submit
    act(() => {
      result.current.handleEmailChange(buildChangeEvent('existing@user.com'));
      result.current.handlePasswordChange(buildChangeEvent('password123'));
      result.current.handleConfirmPasswordChange(buildChangeEvent('password123'));
    });

    await act(async () => {
      result.current.handleSubmit(buildSubmitEvent());
    });

    expect(result.current.serverError).toBe('auth.register.emailConflict');

    // Type in email → error clears
    act(() => {
      result.current.handleEmailChange(buildChangeEvent('new@user.com'));
    });

    expect(result.current.serverError).toBeUndefined();
  });

  it('flow: empty form submit → all validation errors shown', () => {
    const { result } = renderHook(() => useRegisterForm());

    act(() => {
      result.current.handleSubmit(buildSubmitEvent());
    });

    expect(result.current.errors.email).toBe('auth.validation.emailRequired');
    expect(result.current.errors.password).toBe('auth.validation.passwordRequired');
    expect(result.current.errors.confirmPassword).toBe('auth.validation.confirmPasswordRequired');
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('sends only email and password to API (not confirmPassword)', async () => {
    mockPost.mockResolvedValue(buildAuthResponse());

    const { result } = renderHook(() => useRegisterForm());

    act(() => {
      result.current.handleEmailChange(buildChangeEvent('new@user.com'));
      result.current.handlePasswordChange(buildChangeEvent('strongpass123'));
      result.current.handleConfirmPasswordChange(buildChangeEvent('strongpass123'));
    });

    await act(async () => {
      result.current.handleSubmit(buildSubmitEvent());
    });

    const callBody = mockPost.mock.calls[0][1] as Record<string, unknown>;
    expect(callBody).not.toHaveProperty('confirmPassword');
    expect(callBody).toEqual({ email: 'new@user.com', password: 'strongpass123' });
  });
});
