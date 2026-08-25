import { useState } from 'react';

import { useDeleteInviteCodeMutation } from '#features/admin/api/useDeleteInviteCodeMutation';
import { useGenerateCodeMutation } from '#features/admin/api/useGenerateCodeMutation';
import { useInviteCodesQuery } from '#features/admin/api/useInviteCodesQuery';
import type { InviteCodeViewModel } from '#features/admin/model/types';

// ─── Result Interface ────────────────────────────────────────────

export type UseInviteCodesTabResult =
  | { readonly status: 'loading' }
  | { readonly status: 'error'; readonly error: string }
  | {
      readonly status: 'loaded';
      readonly codes: readonly InviteCodeViewModel[];
      readonly generatedCode: string | undefined;
      readonly expiryDate: string;
      readonly isGeneratePending: boolean;
      readonly generateError: string | undefined;
      readonly isDeletePending: boolean;
      readonly deleteError: string | undefined;
      readonly handleGenerate: () => void;
      readonly handleExpiryChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
      readonly handleCopy: () => void;
      readonly handleDelete: (codeId: string) => void;
    };

// ─── Hook ────────────────────────────────────────────────────────

export const useInviteCodesTab = (): UseInviteCodesTabResult => {
  const codesQuery = useInviteCodesQuery();
  const { generate, isLoading: isGeneratePending, error: generateError } = useGenerateCodeMutation();
  const { deleteCode, isLoading: isDeletePending, error: deleteError } = useDeleteInviteCodeMutation();

  const [generatedCode, setGeneratedCode] = useState<string | undefined>(undefined);
  const [expiryDate, setExpiryDate] = useState('');

  if (codesQuery.status === 'loading' || codesQuery.status === 'notLoaded') {
    return { status: 'loading' };
  }

  if (codesQuery.status === 'error') {
    return { status: 'error', error: codesQuery.error };
  }

  const codes: readonly InviteCodeViewModel[] = codesQuery.data.codes.map((dto) => ({
    id: dto.id,
    code: dto.code,
    status: dto.status,
    createdAt: dto.createdAt,
    expiresAt: dto.expiresAt ?? undefined,
    usedBy: dto.usedBy ?? undefined,
    usedAt: dto.usedAt ?? undefined,
  }));

  const handleGenerate = (): void => {
    void generate(expiryDate || undefined).then((result) => {
      setGeneratedCode(result.code);
    });
  };

  const handleExpiryChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setExpiryDate(event.target.value);
  };

  const handleCopy = (): void => {
    if (generatedCode) {
      void navigator.clipboard.writeText(generatedCode);
    }
  };

  const handleDelete = (codeId: string): void => {
    void deleteCode(codeId);
  };

  return {
    status: 'loaded',
    codes,
    generatedCode,
    expiryDate,
    isGeneratePending,
    generateError,
    isDeletePending,
    deleteError,
    handleGenerate,
    handleExpiryChange,
    handleCopy,
    handleDelete,
  };
};
