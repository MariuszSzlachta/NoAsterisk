import { act, renderHook } from '@testing-library/react';
import type { ChangeEvent, FormEvent } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useRegisterForm } from '#features/auth/ui/hooks/useRegisterForm';

// ─── Mock Setup ──────────────────────────────────────────────────

const mockNavigate = vi.fn();
const mockMutateAsync = vi.fn();
const mockReset = vi.fn();
let mockIsLoading = false;
let mockError: string | undefined;

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('#features/auth/api/useRegisterMutation', () => ({
  useRegisterMutation: () => ({
    isLoading: mockIsLoading,
    error: mockError,
    mutateAsync: mockMutateAsync,
    reset: mockReset,
  }),
}));

// ─── Helpers ─────────────────────────────────────────────────────

/** Strong password meeting ADR-010 policy */
const STRONG_PASSWORD = 'P@ssw0rd!x';

const buildChangeEvent = (value: string): ChangeEvent<HTMLInputElement> =>
  ({ target: { value } } as ChangeEvent<HTMLInputElement>);

const buildSubmitEvent = (): FormEvent =>
  ({ preventDefault: vi.fn() } as unknown as FormEvent);

// ─── Tests ───────────────────────────────────────────────────────

describe('useRegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsLoading = false;
    mockError = undefined;
  });

  it('returns initial empty form values', () => {
    const { result } = renderHook(() => useRegisterForm());

    expect(result.current.values).toEqual({ email: '', password: '', confirmPassword: '', inviteCode: '' });
    expect(result.current.errors).toEqual({});
    expect(result.current.serverError).toBeUndefined();
    expect(result.current.isSubmitting).toBe(false);
  });

  it('updates email on handleEmailChange', () => {
    const { result } = renderHook(() => useRegisterForm());

    act(() => {
      result.current.handleEmailChange(buildChangeEvent('new@user.com'));
    });

    expect(result.current.values.email).toBe('new@user.com');
  });

  it('updates password on handlePasswordChange', () => {
    const { result } = renderHook(() => useRegisterForm());

    act(() => {
      result.current.handlePasswordChange(buildChangeEvent('secret123'));
    });

    expect(result.current.values.password).toBe('secret123');
  });

  it('updates confirmPassword on handleConfirmPasswordChange', () => {
    const { result } = renderHook(() => useRegisterForm());

    act(() => {
      result.current.handleConfirmPasswordChange(buildChangeEvent('secret123'));
    });

    expect(result.current.values.confirmPassword).toBe('secret123');
  });

  it('updates inviteCode on handleInviteCodeChange', () => {
    const { result } = renderHook(() => useRegisterForm());

    act(() => {
      result.current.handleInviteCodeChange(buildChangeEvent('ABC123'));
    });

    expect(result.current.values.inviteCode).toBe('ABC123');
  });

  it('clears field error when typing in that field', () => {
    const { result } = renderHook(() => useRegisterForm());

    // Force errors
    act(() => {
      result.current.handleSubmit(buildSubmitEvent());
    });
    expect(result.current.errors.email).toBe('auth.validation.emailRequired');

    // Clear by typing
    act(() => {
      result.current.handleEmailChange(buildChangeEvent('a'));
    });
    expect(result.current.errors.email).toBeUndefined();
  });

  it('sets validation errors on submit with empty form', () => {
    const { result } = renderHook(() => useRegisterForm());

    act(() => {
      result.current.handleSubmit(buildSubmitEvent());
    });

    expect(result.current.errors.email).toBe('auth.validation.emailRequired');
    expect(result.current.errors.password).toBe('auth.validation.passwordRequired');
    expect(result.current.errors.confirmPassword).toBe('auth.validation.confirmPasswordRequired');
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('sets mismatch error when passwords differ', () => {
    const { result } = renderHook(() => useRegisterForm());

    act(() => {
      result.current.handleEmailChange(buildChangeEvent('test@example.com'));
      result.current.handlePasswordChange(buildChangeEvent(STRONG_PASSWORD));
      result.current.handleConfirmPasswordChange(buildChangeEvent('different'));
    });

    act(() => {
      result.current.handleSubmit(buildSubmitEvent());
    });

    expect(result.current.errors.confirmPassword).toBe('auth.validation.passwordsMismatch');
  });

  it('rejects weak password that meets login but not register policy', () => {
    const { result } = renderHook(() => useRegisterForm());

    act(() => {
      result.current.handleEmailChange(buildChangeEvent('test@example.com'));
      result.current.handlePasswordChange(buildChangeEvent('simplepassword'));
      result.current.handleConfirmPasswordChange(buildChangeEvent('simplepassword'));
    });

    act(() => {
      result.current.handleSubmit(buildSubmitEvent());
    });

    expect(result.current.errors.password).toBeDefined();
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('does not call mutateAsync when validation fails', () => {
    const { result } = renderHook(() => useRegisterForm());

    act(() => {
      result.current.handleEmailChange(buildChangeEvent('bad'));
      result.current.handlePasswordChange(buildChangeEvent('short'));
      result.current.handleConfirmPasswordChange(buildChangeEvent('short'));
    });

    act(() => {
      result.current.handleSubmit(buildSubmitEvent());
    });

    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('calls mutateAsync with canonicalized email and password on valid submit', async () => {
    mockMutateAsync.mockResolvedValue({ accessToken: 'token' });

    const { result } = renderHook(() => useRegisterForm());

    act(() => {
      result.current.handleEmailChange(buildChangeEvent('  New@User.COM  '));
      result.current.handlePasswordChange(buildChangeEvent(STRONG_PASSWORD));
      result.current.handleConfirmPasswordChange(buildChangeEvent(STRONG_PASSWORD));
    });

    await act(async () => {
      result.current.handleSubmit(buildSubmitEvent());
    });

    expect(mockMutateAsync).toHaveBeenCalledWith({ email: 'new@user.com', password: STRONG_PASSWORD });
  });

  it('includes inviteCode when provided', async () => {
    mockMutateAsync.mockResolvedValue({ accessToken: 'token' });

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

    expect(mockMutateAsync).toHaveBeenCalledWith({
      email: 'new@user.com',
      password: STRONG_PASSWORD,
      inviteCode: 'ABC123',
    });
  });

  it('navigates to /dashboard on successful registration', async () => {
    mockMutateAsync.mockResolvedValue({ accessToken: 'token' });

    const { result } = renderHook(() => useRegisterForm());

    act(() => {
      result.current.handleEmailChange(buildChangeEvent('new@user.com'));
      result.current.handlePasswordChange(buildChangeEvent(STRONG_PASSWORD));
      result.current.handleConfirmPasswordChange(buildChangeEvent(STRONG_PASSWORD));
    });

    await act(async () => {
      result.current.handleSubmit(buildSubmitEvent());
    });

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('does not navigate on failed registration', async () => {
    mockMutateAsync.mockRejectedValue(new Error('Conflict'));

    const { result } = renderHook(() => useRegisterForm());

    act(() => {
      result.current.handleEmailChange(buildChangeEvent('new@user.com'));
      result.current.handlePasswordChange(buildChangeEvent(STRONG_PASSWORD));
      result.current.handleConfirmPasswordChange(buildChangeEvent(STRONG_PASSWORD));
    });

    await act(async () => {
      result.current.handleSubmit(buildSubmitEvent());
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('prevents default form submission', () => {
    const event = buildSubmitEvent();

    const { result } = renderHook(() => useRegisterForm());

    act(() => {
      result.current.handleSubmit(event);
    });

    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('guards against double submit when isLoading', () => {
    mockIsLoading = true;

    const { result } = renderHook(() => useRegisterForm());

    act(() => {
      result.current.handleEmailChange(buildChangeEvent('test@example.com'));
      result.current.handlePasswordChange(buildChangeEvent(STRONG_PASSWORD));
      result.current.handleConfirmPasswordChange(buildChangeEvent(STRONG_PASSWORD));
    });

    act(() => {
      result.current.handleSubmit(buildSubmitEvent());
    });

    expect(mockMutateAsync).not.toHaveBeenCalled();
  });
});
