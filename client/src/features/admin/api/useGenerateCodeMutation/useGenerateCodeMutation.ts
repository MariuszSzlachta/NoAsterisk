import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '#shared/api';

// ─── Response Type ───────────────────────────────────────────────

interface GenerateCodeResponse {
  readonly id: string;
  readonly code: string;
  readonly expiresAt: string | undefined;
}

// ─── Result Interface ────────────────────────────────────────────

interface UseGenerateCodeMutationResult {
  readonly generate: (expiresAt?: string) => Promise<GenerateCodeResponse>;
  readonly isLoading: boolean;
}

// ─── Hook ────────────────────────────────────────────────────────

export const useGenerateCodeMutation = (): UseGenerateCodeMutationResult => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (expiresAt?: string): Promise<GenerateCodeResponse> => {
      const body: Record<string, unknown> = expiresAt ? { expiresAt } : {};
      return apiClient.post<GenerateCodeResponse, Record<string, unknown>>(
        '/admin/invite-codes',
        body,
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin', 'invite-codes'] });
    },
  });

  const generate = async (expiresAt?: string): Promise<GenerateCodeResponse> => {
    return mutation.mutateAsync(expiresAt);
  };

  return { generate, isLoading: mutation.isPending };
};
