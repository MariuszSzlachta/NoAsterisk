import { useState } from 'react';

import { useImportMutation } from '#features/csv-import/api/useImportMutation';
import { createImportChunks } from '#features/csv-import/model/submission/import-chunks';
import type {
  ImportChunkPayload,
  ImportProgress,
} from '#features/csv-import/model/types';
import { useImportWizardStore } from '#features/csv-import/store/useImportWizardStore';
import { ApiError } from '#shared/api';
import { MAX_RETRIES } from '#features/csv-import/ui/hooks/useImportSubmit/max-retries';
import { RETRY_DELAY_MS } from '#features/csv-import/ui/hooks/useImportSubmit/retry-delay-ms';
import { sleep } from '#features/csv-import/ui/hooks/useImportSubmit/sleep';

interface UseImportSubmitResult {
  readonly progress: ImportProgress;
  readonly handleSubmit: () => Promise<void>;
  readonly canSubmit: boolean;
  readonly importableCount: number;
}

const submitWithRetry = async (
  submitChunk: (chunk: ImportChunkPayload) => Promise<{ saved: number; duplicatesSkipped: number }>,
  chunk: ImportChunkPayload,
  chunkIndex: number,
): Promise<{ saved: number; duplicatesSkipped: number } | { error: string }> => {
  const attempts = Array.from({ length: MAX_RETRIES + 1 }, (_, i) => i);

  const result = await attempts.reduce<
    Promise<{ saved: number; duplicatesSkipped: number } | { error: string } | null>
  >(async (prevPromise, attempt) => {
    const prev = await prevPromise;
    if (prev !== null && !('error' in prev)) {
      return prev;
    }

    try {
      const res = await submitChunk(chunk);
      return { saved: res.saved, duplicatesSkipped: res.duplicatesSkipped };
    } catch (err: unknown) {
      const isRetryable =
        err instanceof ApiError && (err.status >= 500 || err.status === 429);

      if (!isRetryable || attempt === MAX_RETRIES) {
        const message =
          err instanceof ApiError
            ? `Chunk ${chunkIndex + 1}: HTTP ${err.status}`
            : `Chunk ${chunkIndex + 1}: ${err instanceof Error ? err.message : 'Unknown error'}`;
        return { error: message };
      }

      await sleep(RETRY_DELAY_MS * (attempt + 1));
      return null;
    }
  }, Promise.resolve(null));

  return result ?? { error: `Chunk ${chunkIndex + 1}: max retries exceeded` };
};

export const useImportSubmit = (): UseImportSubmitResult => {
  const rows = useImportWizardStore((s) => s.rows);
  const file = useImportWizardStore((s) => s.file);
  const batchId = useImportWizardStore((s) => s.batchId);
  const setSubmitting = useImportWizardStore((s) => s.setSubmitting);

  const { submitChunk } = useImportMutation();

  const [progress, setProgress] = useState<ImportProgress>({
    totalChunks: 0,
    completedChunks: 0,
    totalRows: 0,
    savedRows: 0,
    duplicatesSkipped: 0,
    errors: [],
    status: 'idle',
  });

  const [completedChunkIndices, setCompletedChunkIndices] = useState<
    ReadonlySet<number>
  >(new Set());

  const importableCount = rows.filter(
    (r) => r.status === 'ok' || r.status === 'warning',
  ).length;
  const canSubmit = importableCount > 0 && progress.status !== 'submitting';

  const handleSubmit = async (): Promise<void> => {
    setSubmitting(true);

    // BUG-2 FIX: Use stable batchId from store (generated once per wizard session)
    const stableBatchId = batchId ?? crypto.randomUUID();
    if (!batchId) {
      useImportWizardStore.getState().setSubmitError(undefined);
      useImportWizardStore.setState({ batchId: stableBatchId });
    }

    const isRetry = completedChunkIndices.size > 0;

    const chunks = await createImportChunks(rows, {
      batchId: stableBatchId,
      sourceFilename: file?.name,
    });

    // HIGH-1 FIX: Set isRetry flag on retry submissions
    const chunksWithRetry: readonly ImportChunkPayload[] = isRetry
      ? chunks.map((c) => ({ ...c, isRetry: true }))
      : chunks;

    setProgress({
      totalChunks: chunks.length,
      completedChunks: completedChunkIndices.size,
      totalRows: importableCount,
      savedRows: 0,
      duplicatesSkipped: 0,
      errors: [],
      status: 'submitting',
    });

    const pendingChunks = chunksWithRetry
      .map((chunk, i) => ({ chunk, index: i }))
      .filter(({ index }) => !completedChunkIndices.has(index));

    const { savedTotal, duplicatesTotal, errors, newCompleted } =
      await pendingChunks.reduce<
        Promise<{
          savedTotal: number;
          duplicatesTotal: number;
          errors: Array<{ chunkIndex: number; message: string }>;
          newCompleted: Set<number>;
        }>
      >(
        async (accPromise, { chunk, index }) => {
          const acc = await accPromise;
          const result = await submitWithRetry(submitChunk, chunk, index);

          if ('error' in result) {
            acc.errors.push({ chunkIndex: index, message: result.error });
          }
          if (!('error' in result)) {
            acc.savedTotal += result.saved;
            acc.duplicatesTotal += result.duplicatesSkipped;
            acc.newCompleted.add(index);
          }

          setProgress((prev) => ({
            ...prev,
            completedChunks: acc.newCompleted.size + completedChunkIndices.size,
            savedRows: acc.savedTotal,
            duplicatesSkipped: acc.duplicatesTotal,
            errors: [...acc.errors],
          }));

          return acc;
        },
        Promise.resolve({
          savedTotal: 0,
          duplicatesTotal: 0,
          errors: [],
          newCompleted: new Set(completedChunkIndices),
        }),
      );

    setCompletedChunkIndices(newCompleted);

    const finalStatus = errors.length > 0 ? 'failed' : 'completed';
    setProgress((prev) => ({ ...prev, status: finalStatus }));
    setSubmitting(false);
  };

  return {
    progress,
    handleSubmit,
    canSubmit,
    importableCount,
  };
};
