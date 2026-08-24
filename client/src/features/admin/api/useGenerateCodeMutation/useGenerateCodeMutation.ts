import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '#shared/api';

// ─── Constants ───────────────────────────────────────────────────

const INVITE_CODES_PATH = '/admin/invite-codes' as const;
const INVITE_CODES_QUERY_KEY = ['admin', 'invite-codes'] as const;

// ─── Types ───────────────────────────────────────────────────────

interface GenerateCodeRequest {
  readonly expiresAt?: string;
}

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

  return { generate, isLoading: mutation.isPending };
};
