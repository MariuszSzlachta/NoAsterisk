import { Pencil, Trash2 } from 'lucide-react';

import type { RuleViewModel } from '#features/admin-rules/model/types';
import { useBoundAction } from '#shared/hooks/useBoundAction';
import { Button } from '#shared/ui/Button';

interface RuleActionsProps {
  readonly rule: RuleViewModel;
  readonly onEdit: (ruleId: string) => void;
  readonly onDelete: (ruleId: string) => void;
  readonly editLabel: string;
  readonly deleteLabel: string;
}

export const RuleActions = ({
  rule,
  onEdit,
  onDelete,
  editLabel,
  deleteLabel,
}: RuleActionsProps): React.JSX.Element => {
  const { handleAction: handleEdit } = useBoundAction(rule.id, onEdit);
  const { handleAction: handleDelete } = useBoundAction(rule.id, onDelete);

  return (
    <div className="flex shrink-0 items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        icon={<Pencil size={14} />}
        onClick={handleEdit}
        aria-label={editLabel}
      />
      <Button
        variant="ghost"
        size="icon"
        icon={<Trash2 size={14} />}
        onClick={handleDelete}
        aria-label={deleteLabel}
      />
    </div>
  );
};
