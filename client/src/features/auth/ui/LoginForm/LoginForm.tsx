import { Link } from 'react-router-dom';

import { useLoginForm } from '#features/auth/ui/hooks/useLoginForm';
import { Button } from '#shared/ui/Button';
import { Input } from '#shared/ui/Input';

export const LoginForm = (): React.JSX.Element => {
  const {
    values,
    errors,
    serverError,
    isSubmitting,
    handleEmailChange,
    handlePasswordChange,
    handleSubmit,
  } = useLoginForm();

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-6" noValidate>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground">Zaloguj się</h1>
        <p className="text-sm text-muted-foreground">
          Wpisz dane, aby uzyskać dostęp do konta
        </p>
      </div>

      {serverError && (
        <p className="rounded-md bg-expense-soft px-3 py-2 text-sm text-expense" role="alert">
          {serverError}
        </p>
      )}

      <div className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="email@example.com"
          value={values.email}
          onChange={handleEmailChange}
          error={errors.email}
        />
        <Input
          label="Hasło"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={values.password}
          onChange={handlePasswordChange}
          error={errors.password}
        />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Logowanie...' : 'Zaloguj'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Nie masz konta?{' '}
        <Link
          to="/register"
          className="font-medium text-primary transition-colors hover:text-primary/80"
        >
          Zarejestruj się
        </Link>
      </p>
    </form>
  );
};
