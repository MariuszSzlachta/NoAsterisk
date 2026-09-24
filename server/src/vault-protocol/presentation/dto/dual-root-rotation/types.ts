import type { z } from 'zod';
import type { prepareRotationSchema } from '@vault-protocol/presentation/dto/dual-root-rotation/prepareRotationSchema';
import type { finalizeRotationSchema } from '@vault-protocol/presentation/dto/dual-root-rotation/finalizeRotationSchema';
export type PrepareRotationDto = z.infer<typeof prepareRotationSchema>;
export type FinalizeRotationDto = z.infer<typeof finalizeRotationSchema>;
