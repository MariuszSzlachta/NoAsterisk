// ═══════════════════════════════════════════════════════════════════
// User Settings — useProfileSection Hook
// ═══════════════════════════════════════════════════════════════════

import { useEffect, useState } from 'react';

import { useProfileQuery } from '#features/user-settings/api/useProfileQuery';
import { useUpdateProfileMutation } from '#features/user-settings/api/useUpdateProfileMutation';
import type { ProfileData } from '#features/user-settings/model/types';
import { validateDisplayName } from '#features/user-settings/model/validators';
import type { DisplayNameError } from '#features/user-settings/model/validators';

// ─── Result Interface ────────────────────────────────────────────

interface UseProfileSectionResult {
  readonly profile: ProfileData | undefined;
  readonly isLoading: boolean;
  readonly editedName: string;
  readonly nameError: DisplayNameError | undefined;
  readonly isDirty: boolean;
  readonly isSaving: boolean;
  readonly handleNameChange: (value: string) => void;
  readonly handleSave: () => Promise<boolean>;
}

// ─── Hook ────────────────────────────────────────────────────────

export const useProfileSection = (): UseProfileSectionResult => {
  const { data, isLoading, refetch } = useProfileQuery();
  const { state: saveState, mutateAsync } = useUpdateProfileMutation();

  const [editedName, setEditedName] = useState('');
  const [nameError, setNameError] = useState<DisplayNameError | undefined>(undefined);

  useEffect(() => {
    if (data?.displayName !== undefined) {
      setEditedName(data.displayName);
    }
  }, [data?.displayName]);

  const isDirty = editedName !== (data?.displayName ?? '');

  const handleNameChange = (value: string): void => {
    setEditedName(value);
    setNameError(validateDisplayName(value));
  };

  const handleSave = async (): Promise<boolean> => {
    if (nameError !== undefined) {
      return false;
    }
    const success = await mutateAsync({ displayName: editedName });
    if (success) {
      void refetch();
    }
    return success;
  };

  return {
    profile: data,
    isLoading,
    editedName,
    nameError,
    isDirty,
    isSaving: saveState.isLoading,
    handleNameChange,
    handleSave,
  };
};
