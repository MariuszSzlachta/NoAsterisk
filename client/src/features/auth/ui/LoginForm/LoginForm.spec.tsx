import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LoginForm } from '#features/auth/ui/LoginForm';

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
const mockHandleSubmit = vi.fn();

vi.mock('#features/auth/ui/hooks/useLoginForm', () => ({
  useLoginForm: () => mockLoginFormState,
}));

vi.mock('react-router-dom', () => ({
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));

let mockLoginFormState: {
  values: { email: string; password: string };
  errors: { email?: string; password?: string };
  serverError: string | undefined;
  isSubmitting: boolean;
  handleEmailChange: typeof mockHandleEmailChange;
  handlePasswordChange: typeof mockHandlePasswordChange;
  handleSubmit: typeof mockHandleSubmit;
};

// ─── Tests ───────────────────────────────────────────────────────

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoginFormState = {
      values: { email: '', password: '' },
      errors: {},
      serverError: undefined,
      isSubmitting: false,
      handleEmailChange: mockHandleEmailChange,
      handlePasswordChange: mockHandlePasswordChange,
      handleSubmit: mockHandleSubmit,
    };
  });

  it('renders login title', () => {
    render(<LoginForm />);

    expect(screen.getByText('auth.login.title')).toBeInTheDocument();
  });

  it('renders subtitle', () => {
    render(<LoginForm />);

    expect(screen.getByText('auth.login.subtitle')).toBeInTheDocument();
  });

  it('renders email input with label', () => {
    render(<LoginForm />);

    expect(screen.getByLabelText('auth.login.emailLabel')).toBeInTheDocument();
  });

  it('renders password input with label', () => {
    render(<LoginForm />);

    expect(screen.getByLabelText('auth.login.passwordLabel')).toBeInTheDocument();
  });

  it('renders submit button with correct text', () => {
    render(<LoginForm />);

    expect(screen.getByRole('button', { name: 'auth.login.submit' })).toBeInTheDocument();
  });

  it('renders submitting text when isSubmitting is true', () => {
    mockLoginFormState.isSubmitting = true;

    render(<LoginForm />);

    expect(screen.getByRole('button', { name: 'auth.login.submitting' })).toBeInTheDocument();
  });

  it('disables submit button when isSubmitting', () => {
    mockLoginFormState.isSubmitting = true;

    render(<LoginForm />);

    expect(screen.getByRole('button', { name: 'auth.login.submitting' })).toBeDisabled();
  });

  it('renders server error as alert', () => {
    mockLoginFormState.serverError = 'auth.login.invalidCredentials';

    render(<LoginForm />);

    expect(screen.getByRole('alert')).toHaveTextContent('auth.login.invalidCredentials');
  });

  it('does not render alert when no server error', () => {
    render(<LoginForm />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('renders register link', () => {
    render(<LoginForm />);

    const link = screen.getByRole('link', { name: 'auth.login.registerLink' });
    expect(link).toHaveAttribute('href', '/register');
  });

  it('calls handleSubmit on form submit', () => {
    render(<LoginForm />);

    fireEvent.submit(screen.getByRole('button', { name: 'auth.login.submit' }).closest('form'));

    expect(mockHandleSubmit).toHaveBeenCalled();
  });

  it('displays email validation error', () => {
    mockLoginFormState.errors = { email: 'auth.validation.emailRequired' };

    render(<LoginForm />);

    expect(screen.getByText('auth.validation.emailRequired (min: 8)')).toBeInTheDocument();
  });

  it('displays password validation error', () => {
    mockLoginFormState.errors = { password: 'auth.validation.passwordMinLength' };

    render(<LoginForm />);

    expect(screen.getByText('auth.validation.passwordMinLength (min: 8)')).toBeInTheDocument();
  });
});
