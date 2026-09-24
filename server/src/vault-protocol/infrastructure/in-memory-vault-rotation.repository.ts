import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  RotateVaultRequest,
  RotateVaultResult,
  VaultRotationRepository,
} from '@vault-protocol/domain/ports/vault-rotation.repository';

interface VaultState {
  readonly userId: string;
  readonly workspaceId: string;
  readonly vaultId: string;
  keyId: string;
  deviceId: string;
  envelope: string;
  purpose: string;
  devices: number;
}

@Injectable()
export class InMemoryVaultRotationRepository implements VaultRotationRepository {
  private readonly states = new Map<string, VaultState>();
  private readonly idempotentResults = new Map<string, RotateVaultResult>();
  private readonly idempotentRequests = new Map<string, RotateVaultRequest>();

  seed(state: VaultState): void {
    this.states.set(state.vaultId, { ...state });
  }

  async rotate(request: RotateVaultRequest): Promise<RotateVaultResult> {
    const idempotencyScope = `${request.vaultId}:${request.idempotencyKey}`;
    const previous = this.idempotentResults.get(idempotencyScope);
    if (previous !== undefined) {
      const previousRequest = this.idempotentRequests.get(idempotencyScope);
      if (
        previousRequest === undefined ||
        previousRequest.userId !== request.userId ||
        previousRequest.workspaceId !== request.workspaceId ||
        previousRequest.deviceId !== request.deviceId ||
        previousRequest.currentKeyId !== request.currentKeyId ||
        previousRequest.nextKeyId !== request.nextKeyId ||
        previousRequest.envelopePurpose !== request.envelopePurpose ||
        previousRequest.envelope !== request.envelope ||
        previousRequest.passkeyEnvelope !== request.passkeyEnvelope
      )
        throw new ConflictException('Vault rotation idempotency conflict');
      return previous;
    }
    const state = this.states.get(request.vaultId);
    if (state === undefined) throw new NotFoundException('Vault not found');
    if (
      state.userId !== request.userId ||
      state.workspaceId !== request.workspaceId ||
      state.deviceId !== request.deviceId
    )
      throw new NotFoundException('Vault device not found');
    if (state.keyId !== request.currentKeyId)
      throw new ConflictException('Vault key has changed');
    const result: RotateVaultResult = {
      status: 'rotated',
      keyId: request.nextKeyId,
      revokedDeviceCount: Math.max(0, state.devices - 1),
    };
    state.keyId = request.nextKeyId;
    state.envelope = request.envelope;
    state.purpose = request.envelopePurpose;
    state.devices = 1;
    this.idempotentResults.set(idempotencyScope, result);
    this.idempotentRequests.set(idempotencyScope, { ...request });
    return result;
  }
}
