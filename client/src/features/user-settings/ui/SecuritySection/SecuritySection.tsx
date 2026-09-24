// User Settings — SecuritySection Component

import { useTranslation } from 'react-i18next';
import { Eye, EyeOff } from 'lucide-react';

import { useSecuritySection } from '#features/user-settings/ui/hooks/useSecuritySection';
import { RULE_KEYS } from '#features/user-settings/ui/SecuritySection/constants/rule-keys';
import { RuleItem } from '#features/user-settings/ui/SecuritySection/RuleItem';
import { Button } from '#shared/ui/Button';
import { Card } from '#shared/ui/Card';
import { Input } from '#shared/ui/Input';

export const SecuritySection = (): React.JSX.Element => {
  const { t } = useTranslation();
  const {
    formValues,
    showPasswords,
    validationRules,
    isValid,
    isLoading,
    error,
    handleFieldChange,
    handleToggleShowPasswords,
    handleSubmit,
  } = useSecuritySection();

  const inputType = showPasswords ? 'text' : 'password';

  return (
    <Card className="">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            {t('settings.security.title')}
          </h2>
          <p className="text-xs text-muted-foreground">
            {t('settings.security.subtitle')}
          </p>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={handleToggleShowPasswords}
          aria-label={
            showPasswords
              ? t('settings.security.hidePasswords')
              : t('settings.security.showPasswords')
          }
        >
          {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
        </Button>
      </div>

      <div className="space-y-3">
        <Input
          label={t('settings.security.currentPassword')}
          type={inputType}
          value={formValues.currentPassword}
          onChange={(e) => handleFieldChange('currentPassword', e.target.value)}
          placeholder={t('settings.security.currentPasswordPlaceholder')}
        />
        <Input
          label={t('settings.security.newPassword')}
          type={inputType}
          value={formValues.newPassword}
          onChange={(e) => handleFieldChange('newPassword', e.target.value)}
          placeholder={t('settings.security.newPasswordPlaceholder')}
        />
        <Input
          label={t('settings.security.confirmPassword')}
          type={inputType}
          value={formValues.confirmPassword}
          onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
          placeholder={t('settings.security.confirmPasswordPlaceholder')}
        />
      </div>

      <div className="mt-3 space-y-1.5">
        {RULE_KEYS.map(({ key, i18nKey }) => (
          <RuleItem
            key={key}
            label={t(i18nKey)}
            passed={validationRules[key]}
          />
        ))}
      </div>

      {error && (
        <p className="mt-3 text-xs text-expense" role="alert">
          {error}
        </p>
      )}

      <div className="mt-4">
        <Button onClick={handleSubmit} disabled={!isValid || isLoading}>
          {isLoading
            ? t('settings.security.submitting')
            : t('settings.security.submit')}
        </Button>
      </div>
    </Card>
  );
};
