import { act, renderHook } from '@testing-library/react';
import type { ChangeEvent, FormEvent } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '#features/auth/store/useAuthStore';

import { useRegisterForm } from './useRegisterForm';

// ─── Mock Setup ──────────────────────────────────────────────────

const mockNavigate = vi.fn();
const mockMutateAsync = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

vi.mock('#features/auth/api/useRegisterMutation', () => ({
  useRegisterMutation: () => ({
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

describe('useRegisterForm', () => {
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
    const { result } = renderHook(() => useRegisterForm());

    expect(result.current.values).toEqual({ email: '', password: '', confirmPassword: '' });
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

  it('clears field error when typing in that field', () => {
    useAuthStore.setState({ registerErrors: { email: 'auth.validation.emailRequired' } });

    const { result } = renderHook(() => useRegisterForm());

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
    useAuthStore.setState({
      registerForm: { email: 'test@example.com', password: 'password123', confirmPassword: 'different' },
    });

    const { result } = renderHook(() => useRegisterForm());

    act(() => {
      result.current.handleSubmit(buildSubmitEvent());
    });

    expect(result.current.errors.confirmPassword).toBe('auth.validation.passwordsMismatch');
  });

  it('does not call mutateAsync when validation fails', () => {
    useAuthStore.setState({
      registerForm: { email: 'bad', password: 'short', confirmPassword: 'short' },
    });

    const { result } = renderHook(() => useRegisterForm());

    act(() => {
      result.current.handleSubmit(buildSubmitEvent());
    });

    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('calls mutateAsync with email and password only on valid submit', () => {
    useAuthStore.setState({
      registerForm: { email: 'new@user.com', password: 'password123', confirmPassword: 'password123' },
    });
    mockMutateAsync.mockResolvedValue({ accessToken: 'token' });

    const { result } = renderHook(() => useRegisterForm());

    act(() => {
      result.current.handleSubmit(buildSubmitEvent());
    });

    expect(mockMutateAsync).toHaveBeenCalledWith({ email: 'new@user.com', password: 'password123' });
  });

  it('navigates to /dashboard on successful registration', async () => {
    useAuthStore.setState({
      registerForm: { email: 'new@user.com', password: 'password123', confirmPassword: 'password123' },
    });
    mockMutateAsync.mockResolvedValue({ accessToken: 'token' });

    const { result } = renderHook(() => useRegisterForm());

    await act(async () => {
      result.current.handleSubmit(buildSubmitEvent());
    });

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('does not navigate on failed registration', async () => {
    useAuthStore.setState({
      registerForm: { email: 'new@user.com', password: 'password123', confirmPassword: 'password123' },
    });
    mockMutateAsync.mockRejectedValue(new Error('Conflict'));

    const { result } = renderHook(() => useRegisterForm());

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
});
