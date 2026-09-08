export const IMPORT_PROGRESS_STATUS = {
  idle: 'idle',
  submitting: 'submitting',
  completed: 'completed',
  failed: 'failed',
} satisfies Readonly<
  Record<'idle' | 'submitting' | 'completed' | 'failed', string>
>;
