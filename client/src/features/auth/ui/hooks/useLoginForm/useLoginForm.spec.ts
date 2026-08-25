import { act, renderHook } from '@testing-library/react';
import type { ChangeEvent, FormEvent } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '#features/auth/store/useAuthStore';

import { useLoginForm } from './useLoginForm';

// ─── Mock Setup ──────────────────────────────────────────────────

const mockNavigate = vi.fn();
const mockMutateAsync = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('#features/auth/api/useLoginMutation', () => ({
  useLoginMutation: () => ({
    isLoading: useAuthStore.getState().isSubmitting,
    error: useAuthStore.getState().serverError,
    mutateAsync: mockMutateAsync,
    reset: vi.fn(),
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
    useAuthStore.setState({
      loginForm: { email: '', password: '' },
      loginErrors: {},
      registerForm: { email: '', password: '', confirmPassword: '' },
      registerErrors: {},
      serverError: undefined,
      isSubmitting: false,
    });
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
    useAuthStore.setState({ loginErrors: { email: 'auth.validation.emailRequired' } });

    const { result } = renderHook(() => useLoginForm());

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
    useAuthStore.setState({ loginForm: { email: 'bad', password: 'short' } });

    const { result } = renderHook(() => useLoginForm());

    act(() => {
      result.current.handleSubmit(buildSubmitEvent());
    });

    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('calls mutateAsync with form values on valid submit', () => {
    useAuthStore.setState({ loginForm: { email: 'test@example.com', password: 'password123' } });
    mockMutateAsync.mockResolvedValue({ accessToken: 'token' });

    const { result } = renderHook(() => useLoginForm());

    act(() => {
      result.current.handleSubmit(buildSubmitEvent());
    });

    expect(mockMutateAsync).toHaveBeenCalledWith({ email: 'test@example.com', password: 'password123' });
  });

  it('navigates to /dashboard on successful login', async () => {
    useAuthStore.setState({ loginForm: { email: 'test@example.com', password: 'password123' } });
    mockMutateAsync.mockResolvedValue({ accessToken: 'token' });

    const { result } = renderHook(() => useLoginForm());

    await act(async () => {
      result.current.handleSubmit(buildSubmitEvent());
    });

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('does not navigate on failed login', async () => {
    useAuthStore.setState({ loginForm: { email: 'test@example.com', password: 'password123' } });
    mockMutateAsync.mockRejectedValue(new Error('Unauthorized'));

    const { result } = renderHook(() => useLoginForm());

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
});
