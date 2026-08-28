import type { InviteCodeViewModel } from '#features/admin/model/types/invite-code-view-model';

export interface InviteCodeRowProps {
  readonly code: InviteCodeViewModel;
  readonly onDelete: (codeId: string) => void;
}
