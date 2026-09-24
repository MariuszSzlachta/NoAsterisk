import type { InviteCodeViewModel } from '#features/admin/model/types/invite-code-view-model';

export type UseInviteCodesTabResult =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly error: string }
  | {
      readonly status: 'loaded';
      readonly codes: readonly InviteCodeViewModel[];
      readonly generatedCode: string | undefined;
      readonly copyError: string | undefined;
      readonly expiryDate: string;
      readonly isGeneratePending: boolean;
      readonly generateError: string | undefined;
      readonly isDeletePending: boolean;
      readonly deleteError: string | undefined;
      readonly handleGenerate: () => void;
      readonly handleExpiryChange: (
        event: React.ChangeEvent<HTMLInputElement>,
      ) => void;
      readonly handleCopy: () => void;
      readonly handleDelete: (codeId: string) => void;
    };
