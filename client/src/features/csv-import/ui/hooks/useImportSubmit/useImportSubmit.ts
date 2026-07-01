import { useState } from 'react';

import { ApiError } from '#shared/api';
import { useImportMutation } from '#features/csv-import/api/useImportMutation';
import { createImportChunks } from '#features/csv-import/model/import-chunks';
import type { ImportChunkPayload, ImportProgress, TransactionRow } from '#features/csv-import/model/types';
import { useImportWizardStore } from '#features/csv-import/store/useImportWizardStore';

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1500;

interface UseImportSubmitResult {
  readonly progress: ImportProgress;
  readonly handleSubmit: () => Promise<void>;
  readonly canSubmit: boolean;
  readonly importableCount: number;
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

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

  // Track which chunk indices have been successfully sent
  const [completedChunkIndices, setCompletedChunkIndices] = useState<ReadonlySet<number>>(
    new Set(),
  );

  const importableCount = rows.filter(
    (r) => r.status === 'ok' || r.status === 'warning',
  ).length;
  const canSubmit = importableCount > 0 && progress.status !== 'submitting';

  const submitWithRetry = async (
    chunk: ImportChunkPayload,
    chunkIndex: number,
  ): Promise<{ saved: number; duplicatesSkipped: number } | { error: string }> => {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const result = await submitChunk(chunk);
        return { saved: result.saved, duplicatesSkipped: result.duplicatesSkipped };
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
      }
    }
    return { error: `Chunk ${chunkIndex + 1}: max retries exceeded` };
  };

  const handleSubmit = async (): Promise<void> => {
    setSubmitting(true);

    // BUG-2 FIX: Use stable batchId from store (generated once per wizard session)
    const stableBatchId = batchId ?? crypto.randomUUID();
    // Store it if first submission
    if (!batchId) {
      useImportWizardStore.getState().setSubmitError(undefined);
      // Set batchId in store for retry persistence
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

    let savedTotal = 0;
    let duplicatesTotal = 0;
    const errors: Array<{ chunkIndex: number; message: string }> = [];
    const newCompleted = new Set(completedChunkIndices);

    for (let i = 0; i < chunksWithRetry.length; i++) {
      // Skip already-completed chunks on retry
      if (completedChunkIndices.has(i)) {
        continue;
      }

      const result = await submitWithRetry(chunksWithRetry[i], i);

      if ('error' in result) {
        errors.push({ chunkIndex: i, message: result.error });
      } else {
        savedTotal += result.saved;
        duplicatesTotal += result.duplicatesSkipped;
        newCompleted.add(i);
      }

      setProgress((prev) => ({
        ...prev,
        completedChunks: newCompleted.size,
        savedRows: savedTotal,
        duplicatesSkipped: duplicatesTotal,
        errors: [...errors],
      }));
    }

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
