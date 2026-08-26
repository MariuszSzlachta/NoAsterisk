import { act, renderHook } from '@testing-library/react';
import type { ChangeEvent, FormEvent } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useLoginForm } from './useLoginForm';

// ─── Mock Setup ──────────────────────────────────────────────────

const mockNavigate = vi.fn();
const mockMutateAsync = vi.fn();
const mockReset = vi.fn();
let mockIsLoading = false;
let mockError: string | undefined;

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('#features/auth/api/useLoginMutation', () => ({
  useLoginMutation: () => ({
    isLoading: mockIsLoading,
    error: mockError,
    mutateAsync: mockMutateAsync,
    reset: mockReset,
  }),
}));

// ─── Helpers ─────────────────────────────────────────────────────

const buildChangeEvent = (value: string): ChangeEvent<HTMLInputElement> =>
  ({ target: { value } } as ChangeEvent<HTMLInputElement>);

const buildSubmitEvent = (): FormEvent =>
  ({ preventDefault: vi.fn() } as unknown as FormEvent);

// ─── Tests ───────────────────────────────────────────────────────

describe('useLoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsLoading = false;
    mockError = undefined;
  });

  it('returns initial empty form values', () => {
    const { result } = renderHook(() => useLoginForm());

    expect(result.current.values).toEqual({ email: '', password: '' });
    expect(result.current.errors).toEqual({});
    expect(result.current.serverError).toBeUndefined();
    expect(result.current.isSubmitting).toBe(false);
  });

  it('updates email on handleEmailChange', () => {
    const { result } = renderHook(() => useLoginForm());

    act(() => {
      result.current.handleEmailChange(buildChangeEvent('user@test.com'));
    });

    expect(result.current.values.email).toBe('user@test.com');
  });

  it('updates password on handlePasswordChange', () => {
    const { result } = renderHook(() => useLoginForm());

    act(() => {
      result.current.handlePasswordChange(buildChangeEvent('secret123'));
    });

    expect(result.current.values.password).toBe('secret123');
  });

  it('clears field error when typing in that field', () => {
    const { result } = renderHook(() => useLoginForm());

    // Force an error
    act(() => {
      result.current.handleSubmit(buildSubmitEvent());
    });
    expect(result.current.errors.email).toBe('auth.validation.emailRequired');

    // Clear it by typing
    act(() => {
      result.current.handleEmailChange(buildChangeEvent('a'));
    });
    expect(result.current.errors.email).toBeUndefined();
  });

  it('sets validation errors on submit with empty form', () => {
    const { result } = renderHook(() => useLoginForm());

    act(() => {
      result.current.handleSubmit(buildSubmitEvent());
    });

    expect(result.current.errors.email).toBe('auth.validation.emailRequired');
    expect(result.current.errors.password).toBe('auth.validation.passwordRequired');
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('does not call mutateAsync when validation fails', () => {
    const { result } = renderHook(() => useLoginForm());

    act(() => {
      result.current.handleEmailChange(buildChangeEvent('bad'));
      result.current.handlePasswordChange(buildChangeEvent('short'));
    });

    act(() => {
      result.current.handleSubmit(buildSubmitEvent());
    });

    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('calls mutateAsync with canonicalized email on valid submit', async () => {
    mockMutateAsync.mockResolvedValue({ accessToken: 'token' });

    const { result } = renderHook(() => useLoginForm());

    act(() => {
      result.current.handleEmailChange(buildChangeEvent('  Test@Example.COM  '));
      result.current.handlePasswordChange(buildChangeEvent('password123'));
    });

    await act(async () => {
      result.current.handleSubmit(buildSubmitEvent());
    });

    expect(mockMutateAsync).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password123' });
  });

  it('navigates to /dashboard on successful login', async () => {
    mockMutateAsync.mockResolvedValue({ accessToken: 'token' });

    const { result } = renderHook(() => useLoginForm());

    act(() => {
      result.current.handleEmailChange(buildChangeEvent('test@example.com'));
      result.current.handlePasswordChange(buildChangeEvent('password123'));
    });

    await act(async () => {
      result.current.handleSubmit(buildSubmitEvent());
    });

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('does not navigate on failed login', async () => {
    mockMutateAsync.mockRejectedValue(new Error('Unauthorized'));

    const { result } = renderHook(() => useLoginForm());

    act(() => {
      result.current.handleEmailChange(buildChangeEvent('test@example.com'));
      result.current.handlePasswordChange(buildChangeEvent('password123'));
    });

    await act(async () => {
      result.current.handleSubmit(buildSubmitEvent());
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('prevents default form submission', () => {
    const event = buildSubmitEvent();

    const { result } = renderHook(() => useLoginForm());

    act(() => {
      result.current.handleSubmit(event);
    });

    expect(event.preventDefault).toHaveBeenCalled();
  });

  it('guards against double submit when isLoading', () => {
    mockIsLoading = true;

    const { result } = renderHook(() => useLoginForm());

    act(() => {
      result.current.handleEmailChange(buildChangeEvent('test@example.com'));
      result.current.handlePasswordChange(buildChangeEvent('password123'));
    });

    act(() => {
      result.current.handleSubmit(buildSubmitEvent());
    });

    expect(mockMutateAsync).not.toHaveBeenCalled();
  });
});
