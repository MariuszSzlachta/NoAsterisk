import { CheckCircle, Circle } from 'lucide-react';

import type { RuleItemProps } from '#features/user-settings/ui/SecuritySection/rule-item-props';

export const RuleItem = ({ label, passed }: RuleItemProps): React.JSX.Element => (
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
