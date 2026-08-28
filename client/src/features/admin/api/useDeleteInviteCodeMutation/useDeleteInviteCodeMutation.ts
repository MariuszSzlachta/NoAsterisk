import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '#shared/api';

import { INVITE_CODES_PATH } from '#features/admin/api/constants/invite-codes-path';
import { INVITE_CODES_QUERY_KEY } from '#features/admin/api/constants/invite-codes-query-key';
import { getErrorMessage } from '#features/admin/api/constants/get-error-message';
import type { DeleteInviteCodeResponse } from '#features/admin/api/useDeleteInviteCodeMutation/delete-invite-code-response';
import type { UseDeleteInviteCodeMutationResult } from '#features/admin/api/useDeleteInviteCodeMutation/use-delete-invite-code-mutation-result';

export const useDeleteInviteCodeMutation = (): UseDeleteInviteCodeMutationResult => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (codeId: string): Promise<DeleteInviteCodeResponse> =>
      apiClient.delete<DeleteInviteCodeResponse>(`${INVITE_CODES_PATH}/${codeId}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...INVITE_CODES_QUERY_KEY] });
    },
  });

  const deleteCode = (codeId: string): Promise<DeleteInviteCodeResponse> =>
    mutation.mutateAsync(codeId);

  return { deleteCode, isLoading: mutation.isPending, error: getErrorMessage(mutation.error) };
};
