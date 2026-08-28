export interface UseDangerSectionResult {
  readonly showClearDialog: boolean;
  readonly showDeleteDialog: boolean;
  readonly isDeleting: boolean;
  readonly deleteError: string | undefined;
  readonly deletePassword: string;
  readonly handleOpenClearDialog: () => void;
  readonly handleCloseClearDialog: () => void;
  readonly handleConfirmClear: () => void;
  readonly handleOpenDeleteDialog: () => void;
  readonly handleCloseDeleteDialog: () => void;
  readonly handleDeletePasswordChange: (value: string) => void;
  readonly handleConfirmDelete: () => void;
}
