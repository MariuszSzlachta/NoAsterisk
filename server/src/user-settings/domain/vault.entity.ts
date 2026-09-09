import { randomUUID } from 'node:crypto';
import { DomainError } from '@budget/domain';

export class Vault {
  constructor(
    public readonly id: string,
    public readonly workspaceId: string,
    public readonly encryptedBlob: string,
    public readonly contentHash: string,
    public readonly byteSize: number,
    public readonly revision: number,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {
    if (!id) throw new DomainError('Vault ID cannot be empty');
    if (!workspaceId)
      throw new DomainError('Vault workspaceId cannot be empty');
    if (!encryptedBlob)
      throw new DomainError('Vault encryptedBlob cannot be empty');
    if (!contentHash)
      throw new DomainError('Vault contentHash cannot be empty');
    if (byteSize <= 0) throw new DomainError('Vault byteSize must be positive');
    if (revision < 1) throw new DomainError('Vault revision must be positive');
  }

  static create(props: {
    workspaceId: string;
    encryptedBlob: string;
    contentHash: string;
    byteSize: number;
  }): Vault {
    const now = new Date();
    return new Vault(
      randomUUID(),
      props.workspaceId,
      props.encryptedBlob,
      props.contentHash,
      props.byteSize,
      1,
      now,
      now,
    );
  }

  updateBlob(
    encryptedBlob: string,
    contentHash: string,
    byteSize: number,
  ): Vault {
    if (!encryptedBlob)
      throw new DomainError('Vault encryptedBlob cannot be empty');
    return new Vault(
      this.id,
      this.workspaceId,
      encryptedBlob,
      contentHash,
      byteSize,
      this.revision + 1,
      this.createdAt,
      new Date(),
    );
  }
}
