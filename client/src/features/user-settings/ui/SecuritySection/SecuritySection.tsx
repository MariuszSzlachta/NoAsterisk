// ═══════════════════════════════════════════════════════════════════
// User Settings — SecuritySection Component
// ═══════════════════════════════════════════════════════════════════

import { CheckCircle, Circle, Eye, EyeOff } from 'lucide-react';

import type { PasswordValidationRules } from '#features/user-settings/model/types';
import { useSecuritySection } from '#features/user-settings/ui/hooks/useSecuritySection';
import { Button } from '#shared/ui/Button';
import { Card } from '#shared/ui/Card';
import { Input } from '#shared/ui/Input';

// ─── Validation Rule Display ─────────────────────────────────────

interface RuleItemProps {
  readonly label: string;
  readonly passed: boolean;
}

const RuleItem = ({ label, passed }: RuleItemProps): React.JSX.Element => (
  <div className="flex items-center gap-2">
    {passed ? (
      <CheckCircle size={14} className="text-income" aria-hidden="true" />
    ) : (
      <Circle size={14} className="text-subtle" aria-hidden="true" />
    )}
    <span className={`text-xs ${passed ? 'text-income' : 'text-muted-foreground'}`}>
      {label}
    </span>
  </div>
);

// ─── Rule Labels ─────────────────────────────────────────────────

const RULE_LABELS: ReadonlyArray<{ key: keyof PasswordValidationRules; label: string }> = [
  { key: 'minLength', label: 'Minimum 8 znaków' },
  { key: 'hasUppercase', label: 'Zawiera wielką literę' },
  { key: 'hasLowercase', label: 'Zawiera małą literę' },
  { key: 'hasDigit', label: 'Zawiera cyfrę' },
  { key: 'hasSpecialChar', label: 'Zawiera znak specjalny' },
  { key: 'differentFromCurrent', label: 'Różne od obecnego hasła' },
  { key: 'confirmationMatch', label: 'Potwierdzenie zgodne' },
];

// ─── Component ───────────────────────────────────────────────────

export const SecuritySection = (): React.JSX.Element => {
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
    <Card className="mb-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Bezpieczeństwo</h2>
          <p className="text-xs text-muted-foreground">Zmień hasło do swojego konta.</p>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={handleToggleShowPasswords}
          aria-label={showPasswords ? 'Ukryj hasła' : 'Pokaż hasła'}
        >
          {showPasswords ? <EyeOff size={16} /> : <Eye size={16} />}
        </Button>
      </div>

      <div className="space-y-3">
        <Input
          label="Obecne hasło"
          type={inputType}
          value={formValues.currentPassword}
          onChange={(e) => handleFieldChange('currentPassword', e.target.value)}
          placeholder="Wpisz obecne hasło"
        />
        <Input
          label="Nowe hasło"
          type={inputType}
          value={formValues.newPassword}
          onChange={(e) => handleFieldChange('newPassword', e.target.value)}
          placeholder="Minimum 8 znaków"
        />
        <Input
          label="Potwierdź nowe hasło"
          type={inputType}
          value={formValues.confirmPassword}
          onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
          placeholder="Powtórz nowe hasło"
        />
      </div>

      <div className="mt-3 space-y-1.5">
        {RULE_LABELS.map(({ key, label }) => (
          <RuleItem key={key} label={label} passed={validationRules[key]} />
        ))}
      </div>

      {error && (
        <p className="mt-3 text-xs text-expense" role="alert">{error}</p>
      )}

      <div className="mt-4">
        <Button
          onClick={() => void handleSubmit()}
          disabled={!isValid || isLoading}
        >
          {isLoading ? 'Zmieniam...' : 'Zmień hasło'}
        </Button>
      </div>
    </Card>
  );
};
