// User Settings — useProfileSection Hook

import { useEffect, useState } from 'react';

import { useProfileQuery } from '#features/user-settings/api/useProfileQuery';
import { useUpdateProfileMutation } from '#features/user-settings/api/useUpdateProfileMutation';
import { validateDisplayName } from '#features/user-settings/model/validate-display-name';
import type { DisplayNameError } from '#features/user-settings/model/validate-display-name/display-name-error';
import type { UseProfileSectionResult } from '#features/user-settings/ui/hooks/useProfileSection/use-profile-section-result';

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

  const handleCancel = (): void => {
    setEditedName(data?.displayName ?? '');
    setNameError(undefined);
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
    handleCancel,
  };
};
