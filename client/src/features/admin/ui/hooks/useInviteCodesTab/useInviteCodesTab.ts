import { useState } from 'react';

import {
  useDeleteInviteCodeMutation,
  useGenerateCodeMutation,
  useInviteCodesQuery,
} from '#features/admin';
import type { InviteCodeViewModel } from '#features/admin';

// ─── Result Interface ────────────────────────────────────────────

interface UseInviteCodesTabResult {
  readonly isLoading: boolean;
  readonly codes: readonly InviteCodeViewModel[];
  readonly generatedCode: string | undefined;
  readonly expiryDate: string;
  readonly handleGenerate: () => void;
  readonly handleExpiryChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  readonly handleCopy: () => void;
  readonly handleDelete: (codeId: string) => void;
}

// ─── Hook ────────────────────────────────────────────────────────

export const useInviteCodesTab = (): UseInviteCodesTabResult => {
  const codesQuery = useInviteCodesQuery();
  const { generate } = useGenerateCodeMutation();
  const { deleteCode } = useDeleteInviteCodeMutation();

  const [generatedCode, setGeneratedCode] = useState<string | undefined>(undefined);
  const [expiryDate, setExpiryDate] = useState('');

  const isLoading = codesQuery.status === 'loading';

  const codes: readonly InviteCodeViewModel[] =
    codesQuery.status === 'loaded'
      ? codesQuery.data.codes.map((dto) => ({
          id: dto.id,
          code: dto.code,
          status: dto.status,
          createdAt: dto.createdAt,
          expiresAt: dto.expiresAt ?? undefined,
          usedBy: dto.usedBy ?? undefined,
          usedAt: dto.usedAt ?? undefined,
        }))
      : [];

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
    isLoading,
    codes,
    generatedCode,
    expiryDate,
    handleGenerate,
    handleExpiryChange,
    handleCopy,
    handleDelete,
  };
};
