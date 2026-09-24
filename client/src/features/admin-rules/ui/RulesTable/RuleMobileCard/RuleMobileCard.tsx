import type { RuleViewModel } from '#features/admin-rules/model/types';
import { RuleActions } from '#features/admin-rules/ui/RulesTable/RuleActions';
import { Card } from '#shared/ui/Card';

interface RuleMobileCardProps {
  readonly rule: RuleViewModel;
  readonly onEdit: (ruleId: string) => void;
  readonly onDelete: (ruleId: string) => void;
  readonly categoryLabel: string;
  readonly priorityLabel: string;
  readonly editLabel: string;
  readonly deleteLabel: string;
}

export const RuleMobileCard = ({
  rule,
  onEdit,
  onDelete,
  categoryLabel,
  priorityLabel,
  editLabel,
  deleteLabel,
}: RuleMobileCardProps): React.JSX.Element => (
  <Card className="!h-auto shrink-0 gap-0 border-border bg-surface-2 p-4">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="break-words text-sm font-medium text-foreground">
          {rule.keyword}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {rule.matcherLabel}
        </p>
      </div>
      <RuleActions
        rule={rule}
        onEdit={onEdit}
        onDelete={onDelete}
        editLabel={editLabel}
        deleteLabel={deleteLabel}
      />
    </div>
    <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3 text-xs">
      <div className="min-w-0">
        <p className="text-muted-foreground">{categoryLabel}</p>
        <div className="mt-1 flex min-w-0 items-center gap-2">
          <span
            className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: rule.categoryColor }}
          />
          <span className="truncate text-sm text-foreground">
            {rule.categoryLabel}
          </span>
        </div>
      </div>
      <div className="text-right">
        <p className="text-muted-foreground">{priorityLabel}</p>
        <p className="mt-1 font-mono text-sm tabular-nums text-foreground">
          {rule.priority}
        </p>
      </div>
    </div>
  </Card>
);
