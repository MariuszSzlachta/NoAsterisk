import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { useRegisterForm } from '#features/auth/ui/hooks/useRegisterForm';
import { Button } from '#shared/ui/Button';
import { Input } from '#shared/ui/Input';
import { Checkbox } from '#shared/ui/Checkbox';

export const RegisterForm = (): React.JSX.Element => {
  const { t } = useTranslation();
  const {
    values,
    errors,
    serverError,
    isSubmitting,
    handleEmailChange,
    handlePasswordChange,
    handleConfirmPasswordChange,
    handleInviteCodeChange,
    handlePrivacyAcceptedChange,
    handleTermsAcceptedChange,
    handleSubmit,
  } = useRegisterForm();

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-6" noValidate>
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-foreground">{t('auth.register.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('auth.register.subtitle')}</p>
      </div>

      {serverError && (
        <p className="rounded-md bg-expense-soft px-3 py-2 text-sm text-expense" role="alert">
          {t(serverError)}
        </p>
      )}

      <div className="flex flex-col gap-4">
        <Input
          label={t('auth.register.emailLabel')}
          type="email"
          autoComplete="email"
          placeholder={t('auth.register.emailPlaceholder')}
          value={values.email}
          onChange={handleEmailChange}
          error={errors.email ? t(errors.email, { min: 8 }) : undefined}
        />
        <Input
          label={t('auth.register.passwordLabel')}
          type="password"
          autoComplete="new-password"
          placeholder={t('auth.register.passwordPlaceholder')}
          value={values.password}
          onChange={handlePasswordChange}
          error={errors.password ? t(errors.password, { min: 8 }) : undefined}
        />
        <Input
          label={t('auth.register.confirmPasswordLabel')}
          type="password"
          autoComplete="new-password"
          placeholder={t('auth.register.confirmPasswordPlaceholder')}
          value={values.confirmPassword}
          onChange={handleConfirmPasswordChange}
          error={errors.confirmPassword ? t(errors.confirmPassword) : undefined}
        />
        <Input
          label={t('auth.register.inviteCodeLabel')}
          type="text"
          autoComplete="off"
          placeholder={t('auth.register.inviteCodePlaceholder')}
          value={values.inviteCode}
          onChange={handleInviteCodeChange}
          error={errors.inviteCode ? t(errors.inviteCode) : undefined}
        />
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? t('auth.register.submitting') : t('auth.register.submit')}
      </Button>

      <div className="flex flex-col gap-3 text-sm text-muted-foreground">
        <Checkbox
          id="privacy-consent"
          checked={values.privacyAccepted}
          onChange={handlePrivacyAcceptedChange}
          aria-invalid={errors.privacyAccepted ? true : undefined}
          aria-describedby={errors.privacyAccepted ? 'privacy-consent-error' : undefined}
          label={t('auth.register.privacyConsent')}
        />
        <Checkbox
          id="terms-consent"
          checked={values.termsAccepted}
          onChange={handleTermsAcceptedChange}
          aria-invalid={errors.termsAccepted ? true : undefined}
          aria-describedby={errors.termsAccepted ? 'terms-consent-error' : undefined}
          label={t('auth.register.termsConsent')}
        />
        {errors.privacyAccepted && <p id="privacy-consent-error" role="alert">{t(errors.privacyAccepted)}</p>}
        {errors.termsAccepted && <p id="terms-consent-error" role="alert">{t(errors.termsAccepted)}</p>}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        {t('auth.register.hasAccount')}{' '}
        <Link
          to="/login"
          className="font-medium text-primary transition-colors hover:text-primary/80"
        >
          {t('auth.register.loginLink')}
        </Link>
      </p>
      <p className="text-center text-xs text-muted-foreground">
        <Link className="underline" to="/privacy">{t('legal.privacy.title')}</Link>{' · '}
        <Link className="underline" to="/terms">{t('legal.terms.title')}</Link>
      </p>
    </form>
  );
};
