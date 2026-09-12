import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type {
  CreateWebauthnCredential,
  StoredWebauthnCredential,
  WebauthnCredentialRepository,
} from '@vault-protocol/domain/ports/webauthn-credential.repository';

@Injectable()
export class InMemoryWebauthnCredentialRepository implements WebauthnCredentialRepository {
  private readonly credentials = new Map<string, StoredWebauthnCredential>();

  async create(input: CreateWebauthnCredential): Promise<void> {
    if (this.credentials.has(input.credentialId))
      throw new Error('WebAuthn credential already exists');
    const record: StoredWebauthnCredential = {
      id: randomUUID(),
      ...input,
      publicKey: input.publicKey.slice(),
      transports: [...input.transports],
    };
    this.credentials.set(record.credentialId, record);
  }

  async findActiveByCredentialId(
    credentialId: string,
  ): Promise<StoredWebauthnCredential | undefined> {
    const credential = this.credentials.get(credentialId);
    return credential?.revokedAt === undefined ? credential : undefined;
  }

  async listActiveByUserId(
    userId: string,
  ): Promise<ReadonlyArray<StoredWebauthnCredential>> {
    return [...this.credentials.values()].filter(
      (credential) =>
        credential.userId === userId && credential.revokedAt === undefined,
    );
  }

  async updateCounter(credentialId: string, counter: number): Promise<void> {
    const credential = this.credentials.get(credentialId);
    if (credential === undefined || credential.revokedAt !== undefined)
      throw new Error('WebAuthn credential not found');
    this.credentials.set(credentialId, { ...credential, counter });
  }

  async revoke(userId: string, credentialId: string): Promise<void> {
    const credential = this.credentials.get(credentialId);
    if (credential === undefined || credential.userId !== userId) return;
    this.credentials.set(credentialId, {
      ...credential,
      revokedAt: new Date(),
    });
  }
}
