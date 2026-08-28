import type { GenerateCodeResponse } from '#features/admin/api/useGenerateCodeMutation/generate-code-response';

export interface UseGenerateCodeMutationResult {
  readonly generate: (expiresAt?: string) => Promise<GenerateCodeResponse>;
  readonly isLoading: boolean;
  readonly error: string | undefined;
}
