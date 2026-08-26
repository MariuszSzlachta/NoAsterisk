import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { RegisterForm } from './RegisterForm';

// ─── Mock Setup ──────────────────────────────────────────────────

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (params?.['min']) return `${key} (min: ${params['min']})`;
      return key;
    },
  }),
}));

const mockHandleEmailChange = vi.fn();
const mockHandlePasswordChange = vi.fn();
const mockHandleConfirmPasswordChange = vi.fn();
const mockHandleInviteCodeChange = vi.fn();
const mockHandleSubmit = vi.fn();

vi.mock('#features/auth/ui/hooks/useRegisterForm', () => ({
  useRegisterForm: () => mockRegisterFormState,
}));

vi.mock('react-router-dom', () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

let mockRegisterFormState: {
  values: { email: string; password: string; confirmPassword: string; inviteCode: string };
  errors: { email?: string; password?: string; confirmPassword?: string; inviteCode?: string };
  serverError: string | undefined;
  isSubmitting: boolean;
  handleEmailChange: typeof mockHandleEmailChange;
  handlePasswordChange: typeof mockHandlePasswordChange;
  handleConfirmPasswordChange: typeof mockHandleConfirmPasswordChange;
  handleInviteCodeChange: typeof mockHandleInviteCodeChange;
  handleSubmit: typeof mockHandleSubmit;
};

// ─── Tests ───────────────────────────────────────────────────────

describe('RegisterForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRegisterFormState = {
      values: { email: '', password: '', confirmPassword: '', inviteCode: '' },
      errors: {},
      serverError: undefined,
      isSubmitting: false,
      handleEmailChange: mockHandleEmailChange,
      handlePasswordChange: mockHandlePasswordChange,
      handleConfirmPasswordChange: mockHandleConfirmPasswordChange,
      handleInviteCodeChange: mockHandleInviteCodeChange,
      handleSubmit: mockHandleSubmit,
    };
  });

  it('renders register title', () => {
    render(<RegisterForm />);

    expect(screen.getByText('auth.register.title')).toBeInTheDocument();
  });

  it('renders subtitle', () => {
    render(<RegisterForm />);

    expect(screen.getByText('auth.register.subtitle')).toBeInTheDocument();
  });

  it('renders email input with label', () => {
    render(<RegisterForm />);

    expect(screen.getByLabelText('auth.register.emailLabel')).toBeInTheDocument();
  });

  it('renders password input with label', () => {
    render(<RegisterForm />);

    expect(screen.getByLabelText('auth.register.passwordLabel')).toBeInTheDocument();
  });

  it('renders confirm password input with label', () => {
    render(<RegisterForm />);

    expect(screen.getByLabelText('auth.register.confirmPasswordLabel')).toBeInTheDocument();
  });

  it('renders invite code input with label', () => {
    render(<RegisterForm />);

    expect(screen.getByLabelText('auth.register.inviteCodeLabel')).toBeInTheDocument();
  });

  it('renders submit button with correct text', () => {
    render(<RegisterForm />);

    expect(screen.getByRole('button', { name: 'auth.register.submit' })).toBeInTheDocument();
  });

  it('renders submitting text when isSubmitting is true', () => {
    mockRegisterFormState.isSubmitting = true;

    render(<RegisterForm />);

    expect(screen.getByRole('button', { name: 'auth.register.submitting' })).toBeInTheDocument();
  });

  it('disables submit button when isSubmitting', () => {
    mockRegisterFormState.isSubmitting = true;

    render(<RegisterForm />);

    expect(screen.getByRole('button', { name: 'auth.register.submitting' })).toBeDisabled();
  });

  it('renders server error as alert', () => {
    mockRegisterFormState.serverError = 'auth.register.emailConflict';

    render(<RegisterForm />);

    expect(screen.getByRole('alert')).toHaveTextContent('auth.register.emailConflict');
  });

  it('does not render alert when no server error', () => {
    render(<RegisterForm />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders login link', () => {
    render(<RegisterForm />);

    const link = screen.getByRole('link', { name: 'auth.register.loginLink' });
    expect(link).toHaveAttribute('href', '/login');
  });

  it('calls handleSubmit on form submit', () => {
    render(<RegisterForm />);

    fireEvent.submit(screen.getByRole('button', { name: 'auth.register.submit' }).closest('form')!);

    expect(mockHandleSubmit).toHaveBeenCalled();
  });

  it('displays email validation error', () => {
    mockRegisterFormState.errors = { email: 'auth.validation.emailInvalid' };

    render(<RegisterForm />);

    expect(screen.getByText('auth.validation.emailInvalid (min: 8)')).toBeInTheDocument();
  });

  it('displays password validation error', () => {
    mockRegisterFormState.errors = { password: 'auth.validation.passwordMinLength' };

    render(<RegisterForm />);

    expect(screen.getByText('auth.validation.passwordMinLength (min: 8)')).toBeInTheDocument();
  });

  it('displays confirm password validation error', () => {
    mockRegisterFormState.errors = { confirmPassword: 'auth.validation.passwordsMismatch' };

    render(<RegisterForm />);

    expect(screen.getByText('auth.validation.passwordsMismatch')).toBeInTheDocument();
  });

  it('displays invite code validation error', () => {
    mockRegisterFormState.errors = { inviteCode: 'auth.validation.inviteCodeInvalid' };

    render(<RegisterForm />);

    expect(screen.getByText('auth.validation.inviteCodeInvalid')).toBeInTheDocument();
  });
});
