import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useDeleteInviteCodeMutation } from '#features/admin/api/useDeleteInviteCodeMutation';
import { useGenerateCodeMutation } from '#features/admin/api/useGenerateCodeMutation';
import { useInviteCodesQuery } from '#features/admin/api/useInviteCodesQuery';
import type { InviteCodeViewModel } from '#features/admin/model/types/invite-code-view-model';
import type { UseInviteCodesTabResult } from '#features/admin/ui/hooks/useInviteCodesTab/use-invite-codes-tab-result';

export const useInviteCodesTab = (): UseInviteCodesTabResult => {
  const { t } = useTranslation();
  const codesQuery = useInviteCodesQuery();
  const {
    generate,
    isLoading: isGeneratePending,
    error: generateError,
  } = useGenerateCodeMutation();
  const {
    deleteCode,
    isLoading: isDeletePending,
    error: deleteError,
  } = useDeleteInviteCodeMutation();

  const [generatedCode, setGeneratedCode] = useState<string | undefined>(
    undefined,
  );
  const [copyError, setCopyError] = useState<string | undefined>(undefined);
  const [expiryDate, setExpiryDate] = useState('');

  if (codesQuery.status === 'loading' || codesQuery.status === 'notLoaded') {
    return { status: 'loading' };
  }

  if (codesQuery.status === 'error') {
    return { status: 'error', error: codesQuery.error };
  }

  const codes: readonly InviteCodeViewModel[] = codesQuery.data.codes.map(
    (dto) => ({
      id: dto.id,
      code: dto.code,
      status: dto.status,
      createdAt: dto.createdAt,
      expiresAt: dto.expiresAt ?? undefined,
      usedBy: dto.usedBy ?? undefined,
      usedAt: dto.usedAt ?? undefined,
    }),
  );

  const handleGenerate = (): void => {
    setCopyError(undefined);
    void generate(expiryDate || undefined).then((result) => {
      setGeneratedCode(result.code);
    });
  };

  const handleExpiryChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    setExpiryDate(event.target.value);
  };

  const handleCopy = (): void => {
    if (!generatedCode) return;

    if (navigator.clipboard === undefined) {
      setCopyError(t('admin.codes.copyUnavailable'));
      return;
    }

    setCopyError(undefined);
    void navigator.clipboard
      .writeText(generatedCode)
      .catch(() => setCopyError(t('admin.codes.copyUnavailable')));
  };

  const handleDelete = (codeId: string): void => {
    void deleteCode(codeId);
  };

  return {
    status: 'loaded',
    codes,
    generatedCode,
    copyError,
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
