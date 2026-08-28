import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';

import type {
  ImportChunkPayload,
  ImportChunkResult,
} from '#features/csv-import/model/types';
import { apiClient } from '#shared/api';

export const importChunkResultSchema = z.object({
  status: z.enum(['accepted', 'partial', 'rejected']),
  saved: z.number(),
  duplicatesSkipped: z.number(),
  rejected: z
    .array(z.object({ rowIndex: z.number(), reason: z.string() }))
    .optional(),
});

interface UseImportMutationResult {
  readonly submitChunk: (
    chunk: ImportChunkPayload,
  ) => Promise<ImportChunkResult>;
}

export const useImportMutation = (): UseImportMutationResult => {
  const mutation = useMutation({
    mutationFn: async (
      chunk: ImportChunkPayload,
    ): Promise<ImportChunkResult> => {
      // Serialize payload — HttpClient expects Record<string, unknown>
      const body: Record<string, unknown> = {
        batchId: chunk.batchId,
        batchHash: chunk.batchHash,
        sourceFilename: chunk.sourceFilename,
        profileId: chunk.profileId,
        rows: chunk.rows,
        isRetry: chunk.isRetry,
      };

      const response = await apiClient.post<
        Record<string, unknown>,
        Record<string, unknown>
      >('/imports', body);

      // Validate response shape
      return importChunkResultSchema.parse(response);
    },
  });

  const submitChunk = async (
    chunk: ImportChunkPayload,
  ): Promise<ImportChunkResult> => {
    return mutation.mutateAsync(chunk);
  };

  return {
    submitChunk,
  };
};
