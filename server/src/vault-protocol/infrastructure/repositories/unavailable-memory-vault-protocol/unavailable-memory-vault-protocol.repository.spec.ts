import { DomainError } from '@budget/domain';
import { UnavailableMemoryVaultProtocolRepository } from './unavailable-memory-vault-protocol.repository';

describe('UnavailableMemoryVaultProtocolRepository', () => {
  it('fails closed for read, write, and authentication storage operations', () => {
    const repository = new UnavailableMemoryVaultProtocolRepository();
    const operations = [
      () => repository.get(),
      () => repository.saveIfCurrent(),
      () => repository.issue(),
      () => repository.create(),
      () => repository.rotate(),
    ];

    for (const operation of operations) expect(operation).toThrow(DomainError);
    for (const operation of operations)
      expect(operation).toThrow('Vault protocol persistence is unavailable');
  });
});
