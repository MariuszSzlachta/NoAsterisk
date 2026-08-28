import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '#shared/api';

import { INVITE_CODES_PATH } from '#features/admin/api/constants/invite-codes-path';
import { INVITE_CODES_QUERY_KEY } from '#features/admin/api/constants/invite-codes-query-key';
import { getErrorMessage } from '#features/admin/api/constants/get-error-message';
import type { GenerateCodeRequest } from '#features/admin/api/useGenerateCodeMutation/generate-code-request';
import type { GenerateCodeResponse } from '#features/admin/api/useGenerateCodeMutation/generate-code-response';
import type { UseGenerateCodeMutationResult } from '#features/admin/api/useGenerateCodeMutation/use-generate-code-mutation-result';

export const useGenerateCodeMutation = (): UseGenerateCodeMutationResult => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (expiresAt?: string): Promise<GenerateCodeResponse> => {
      const body: GenerateCodeRequest = expiresAt ? { expiresAt } : {};
      return apiClient.post<GenerateCodeResponse, GenerateCodeRequest>(
        INVITE_CODES_PATH,
        body,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: [...INVITE_CODES_QUERY_KEY] });
    },
  });

  const generate = (expiresAt?: string): Promise<GenerateCodeResponse> =>
    mutation.mutateAsync(expiresAt);

  return { generate, isLoading: mutation.isPending, error: getErrorMessage(mutation.error) };
};
