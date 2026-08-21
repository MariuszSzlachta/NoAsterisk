import { randomUUID } from 'node:crypto';
import { DomainError } from '@budget/domain';

export class Vault {
  constructor(
    public readonly id: string,
    public readonly workspaceId: string,
    public readonly encryptedBlob: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {
    if (!id) throw new DomainError('Vault ID cannot be empty');
    if (!workspaceId)
      throw new DomainError('Vault workspaceId cannot be empty');
    if (!encryptedBlob)
      throw new DomainError('Vault encryptedBlob cannot be empty');
  }

  static create(props: { workspaceId: string; encryptedBlob: string }): Vault {
    const now = new Date();
    return new Vault(
      randomUUID(),
      props.workspaceId,
      props.encryptedBlob,
      now,
      now,
    );
  }

  updateBlob(encryptedBlob: string): Vault {
    if (!encryptedBlob)
      throw new DomainError('Vault encryptedBlob cannot be empty');
    return new Vault(
      this.id,
      this.workspaceId,
      encryptedBlob,
      this.createdAt,
      new Date(),
    );
  }
}
