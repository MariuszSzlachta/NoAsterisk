import type { DualRootRotationRepository } from '@vault-protocol/domain/ports/dual-root-rotation';
import { buildVaultRotationTranscript } from '@vault-protocol/testing/buildVaultRotationTranscript';
export const buildDualRootRotationRepositoryDouble =
  (): jest.Mocked<DualRootRotationRepository> => ({
    prepare: jest.fn().mockResolvedValue(buildVaultRotationTranscript()),
    finalize: jest.fn().mockResolvedValue(undefined),
  });
