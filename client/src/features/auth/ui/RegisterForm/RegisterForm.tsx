import { Link } from 'react-router-dom';

import { useRegisterForm } from '#features/auth/ui/hooks/useRegisterForm';
import { Button } from '#shared/ui/Button';
import { Input } from '#shared/ui/Input';

export const RegisterForm = (): React.JSX.Element => {
  const {
    values,
    errors,
    serverError,
    isSubmitting,
    handleEmailChange,
    handlePasswordChange,
    handleConfirmPasswordChange,
    handleSubmit,
  } = useRegisterForm();

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-6" noValidate>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground">Utwórz konto</h1>
        <p className="text-sm text-muted-foreground">
          Wypełnij formularz, aby utworzyć nowe konto
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
          autoComplete="new-password"
          placeholder="••••••••"
          value={values.password}
          onChange={handlePasswordChange}
          error={errors.password}
        />
        <Input
          label="Potwierdź hasło"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={values.confirmPassword}
          onChange={handleConfirmPasswordChange}
          error={errors.confirmPassword}
        />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? 'Tworzenie konta...' : 'Zarejestruj się'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Masz już konto?{' '}
        <Link
          to="/login"
          className="font-medium text-primary transition-colors hover:text-primary/80"
        >
          Zaloguj się
        </Link>
      </p>
    </form>
  );
};
