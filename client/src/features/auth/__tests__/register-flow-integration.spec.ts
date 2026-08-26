import { act, renderHook } from '@testing-library/react';
import type { ChangeEvent, FormEvent } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

/** Strong password meeting ADR-010: uppercase, lowercase, digit, special */
const STRONG_PASSWORD = 'P@ssw0rd!x';

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
  });

  it('flow: fill form → submit → token stored → navigate', async () => {
    mockPost.mockResolvedValue(buildAuthResponse());

    const { result } = renderHook(() => useRegisterForm());

    act(() => {
      result.current.handleEmailChange(buildChangeEvent('new@user.com'));
      result.current.handlePasswordChange(buildChangeEvent(STRONG_PASSWORD));
      result.current.handleConfirmPasswordChange(buildChangeEvent(STRONG_PASSWORD));
    });

    await act(async () => {
      result.current.handleSubmit(buildSubmitEvent());
    });

    expect(mockPost).toHaveBeenCalledWith(
      '/auth/register',
      { email: 'new@user.com', password: STRONG_PASSWORD },
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
      result.current.handlePasswordChange(buildChangeEvent(STRONG_PASSWORD));
      result.current.handleConfirmPasswordChange(buildChangeEvent('different'));
    });

    act(() => {
      result.current.handleSubmit(buildSubmitEvent());
    });

    expect(result.current.errors.confirmPassword).toBe('auth.validation.passwordsMismatch');
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('flow: weak password → validation error → no API call', () => {
    const { result } = renderHook(() => useRegisterForm());

    act(() => {
      result.current.handleEmailChange(buildChangeEvent('new@user.com'));
      result.current.handlePasswordChange(buildChangeEvent('short'));
      result.current.handleConfirmPasswordChange(buildChangeEvent('short'));
    });

    act(() => {
      result.current.handleSubmit(buildSubmitEvent());
    });

    expect(result.current.errors.password).toBe('auth.validation.passwordMinLength');
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('flow: password without uppercase → validation error', () => {
    const { result } = renderHook(() => useRegisterForm());

    act(() => {
      result.current.handleEmailChange(buildChangeEvent('new@user.com'));
      result.current.handlePasswordChange(buildChangeEvent('p@ssw0rd!'));
      result.current.handleConfirmPasswordChange(buildChangeEvent('p@ssw0rd!'));
    });

    act(() => {
      result.current.handleSubmit(buildSubmitEvent());
    });

    expect(result.current.errors.password).toBe('auth.validation.passwordUppercase');
    expect(mockPost).not.toHaveBeenCalled();
  });

  it('flow: submit → 400 duplicate email → shows conflict error', async () => {
    const { ApiError } = await import('#shared/api');
    mockPost.mockRejectedValue(
      new ApiError('Bad Request', 400, { statusCode: 400, message: 'Registration failed' }),
    );

    const { result } = renderHook(() => useRegisterForm());

    act(() => {
      result.current.handleEmailChange(buildChangeEvent('existing@user.com'));
      result.current.handlePasswordChange(buildChangeEvent(STRONG_PASSWORD));
      result.current.handleConfirmPasswordChange(buildChangeEvent(STRONG_PASSWORD));
    });

    await act(async () => {
      result.current.handleSubmit(buildSubmitEvent());
    });

    expect(result.current.serverError).toBe('auth.register.emailConflict');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('flow: submit → 400 invalid invite code → shows invite error', async () => {
    const { ApiError } = await import('#shared/api');
    mockPost.mockRejectedValue(
      new ApiError('Bad Request', 400, { statusCode: 400, message: 'Invalid invite code' }),
    );

    const { result } = renderHook(() => useRegisterForm());

    act(() => {
      result.current.handleEmailChange(buildChangeEvent('new@user.com'));
      result.current.handlePasswordChange(buildChangeEvent(STRONG_PASSWORD));
      result.current.handleConfirmPasswordChange(buildChangeEvent(STRONG_PASSWORD));
      result.current.handleInviteCodeChange(buildChangeEvent('BADCODE'));
    });

    await act(async () => {
      result.current.handleSubmit(buildSubmitEvent());
    });

    expect(result.current.serverError).toBe('auth.register.invalidInviteCode');
  });

  it('flow: submit → 500 → shows generic error', async () => {
    const { ApiError } = await import('#shared/api');
    mockPost.mockRejectedValue(new ApiError('Internal', 500));

    const { result } = renderHook(() => useRegisterForm());

    act(() => {
      result.current.handleEmailChange(buildChangeEvent('new@user.com'));
      result.current.handlePasswordChange(buildChangeEvent(STRONG_PASSWORD));
      result.current.handleConfirmPasswordChange(buildChangeEvent(STRONG_PASSWORD));
    });

    await act(async () => {
      result.current.handleSubmit(buildSubmitEvent());
    });

    expect(result.current.serverError).toBe('auth.register.genericError');
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

  it('sends inviteCode to API when provided', async () => {
    mockPost.mockResolvedValue(buildAuthResponse());

    const { result } = renderHook(() => useRegisterForm());

    act(() => {
      result.current.handleEmailChange(buildChangeEvent('new@user.com'));
      result.current.handlePasswordChange(buildChangeEvent(STRONG_PASSWORD));
      result.current.handleConfirmPasswordChange(buildChangeEvent(STRONG_PASSWORD));
      result.current.handleInviteCodeChange(buildChangeEvent('ABC123'));
    });

    await act(async () => {
      result.current.handleSubmit(buildSubmitEvent());
    });

    expect(mockPost).toHaveBeenCalledTimes(1);
    const [, callBody] = mockPost.mock.calls[0] as [string, Record<string, unknown>];
    expect(callBody).toEqual({
      email: 'new@user.com',
      password: STRONG_PASSWORD,
      inviteCode: 'ABC123',
    });
  });

  it('sends only email and password when inviteCode is empty', async () => {
    mockPost.mockResolvedValue(buildAuthResponse());

    const { result } = renderHook(() => useRegisterForm());

    act(() => {
      result.current.handleEmailChange(buildChangeEvent('new@user.com'));
      result.current.handlePasswordChange(buildChangeEvent(STRONG_PASSWORD));
      result.current.handleConfirmPasswordChange(buildChangeEvent(STRONG_PASSWORD));
    });

    await act(async () => {
      result.current.handleSubmit(buildSubmitEvent());
    });

    expect(mockPost).toHaveBeenCalledTimes(1);
    const [, callBody] = mockPost.mock.calls[0] as [string, Record<string, unknown>];
    expect(callBody).not.toHaveProperty('inviteCode');
    expect(callBody).toEqual({ email: 'new@user.com', password: STRONG_PASSWORD });
  });

  it('canonicalizes email before sending to API', async () => {
    mockPost.mockResolvedValue(buildAuthResponse());

    const { result } = renderHook(() => useRegisterForm());

    act(() => {
      result.current.handleEmailChange(buildChangeEvent('  NEW@User.COM  '));
      result.current.handlePasswordChange(buildChangeEvent(STRONG_PASSWORD));
      result.current.handleConfirmPasswordChange(buildChangeEvent(STRONG_PASSWORD));
    });

    await act(async () => {
      result.current.handleSubmit(buildSubmitEvent());
      await Promise.resolve();
    });

    expect(mockPost).toHaveBeenCalledTimes(1);
    expect(mockPost).toHaveBeenCalledWith(
      '/auth/register',
      expect.objectContaining({ email: 'new@user.com' }),
      { skipAuth: true },
    );
  });
});
