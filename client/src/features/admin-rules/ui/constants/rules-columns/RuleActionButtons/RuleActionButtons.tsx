import type { TFunction } from 'i18next';
import { Pencil, Trash2 } from 'lucide-react';

import type { RuleViewModel } from '#features/admin-rules/model/types';
import { useBoundAction } from '#shared/hooks/useBoundAction';
import { Button } from '#shared/ui/Button';

interface RuleActionButtonsProps {
  readonly row: RuleViewModel;
  readonly handleDelete: (id: string) => void;
  readonly handleEdit: (id: string) => void;
  readonly t: TFunction;
}

export const RuleActionButtons = ({
  row,
  handleDelete,
  handleEdit,
  t,
}: RuleActionButtonsProps): React.JSX.Element => {
  const { handleAction: edit } = useBoundAction(row.id, handleEdit);
  const { handleAction: remove } = useBoundAction(row.id, handleDelete);

  return (
    <span className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        icon={<Pencil size={14} />}
        onClick={edit}
        aria-label={t('rules.actions.edit', { keyword: row.keyword })}
      />
      <Button
        variant="ghost"
        size="icon"
        icon={<Trash2 size={14} />}
        onClick={remove}
        aria-label={t('rules.actions.delete', { keyword: row.keyword })}
      />
    </span>
  );
};
