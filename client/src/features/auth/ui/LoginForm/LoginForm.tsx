import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { useLoginForm } from '#features/auth/ui/hooks/useLoginForm';
import { Button } from '#shared/ui/Button';
import { Input } from '#shared/ui/Input';

export const LoginForm = (): React.JSX.Element => {
  const { t } = useTranslation();
  const {
    values,
    errors,
    serverError,
    isSubmitting,
    handleEmailChange,
    handlePasswordChange,
    handleSubmit,
    handlePasskeyLogin,
    isPasskeySubmitting,
  } = useLoginForm();

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-6" noValidate>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground">{t('auth.login.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('auth.login.subtitle')}</p>
      </div>

      {serverError && (
        <p className="rounded-md bg-expense-soft px-3 py-2 text-sm text-expense" role="alert">
          {t(serverError)}
        </p>
      )}

      <div className="flex flex-col gap-4">
        <Input
          label={t('auth.login.emailLabel')}
          type="email"
          autoComplete="email"
          placeholder={t('auth.login.emailPlaceholder')}
          value={values.email}
          onChange={handleEmailChange}
          error={errors.email ? t(errors.email, { min: 8 }) : undefined}
        />
        <Input
          label={t('auth.login.passwordLabel')}
          type="password"
          autoComplete="current-password"
          placeholder={t('auth.login.passwordPlaceholder')}
          value={values.password}
          onChange={handlePasswordChange}
          error={errors.password ? t(errors.password, { min: 8 }) : undefined}
        />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? t('auth.login.submitting') : t('auth.login.submit')}
      </Button>

      <Button
        type="button"
        variant="secondary"
        disabled={isSubmitting}
        onClick={handlePasskeyLogin}
        className="w-full"
      >
        {isPasskeySubmitting
          ? t('auth.login.passkeySubmitting')
          : t('auth.login.passkeySubmit')}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t('auth.login.noAccount')}{' '}
        <Link
          to="/register"
          className="font-medium text-primary transition-colors hover:text-primary/80"
        >
          {t('auth.login.registerLink')}
        </Link>
      </p>
    </form>
  );
};
