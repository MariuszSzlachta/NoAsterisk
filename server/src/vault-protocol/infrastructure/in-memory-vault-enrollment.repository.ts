import { Injectable } from '@nestjs/common';
import type {
  EnrollmentPreparation,
  VaultEnrollmentConfirmation,
  VaultEnrollmentRepository,
  VaultEnrollmentRequest,
} from '@vault-protocol/domain/ports/vault-enrollment.repository';
import { InMemoryVaultProtocolState } from './in-memory-vault-protocol-state';

@Injectable()
export class InMemoryVaultEnrollmentRepository implements VaultEnrollmentRepository {
  constructor(
    private readonly state: InMemoryVaultProtocolState = new InMemoryVaultProtocolState(),
  ) {}

  async prepare(
    userId: string,
    workspaceId: string,
    deviceId: string,
    vaultId?: string,
  ): Promise<EnrollmentPreparation> {
    return this.state.prepare(userId, workspaceId, deviceId, vaultId);
  }

  async finalize(request: VaultEnrollmentRequest): Promise<void> {
    await this.state.finalize(request);
  }

  async confirm(request: VaultEnrollmentConfirmation): Promise<void> {
    this.state.confirm(request);
  }
}
