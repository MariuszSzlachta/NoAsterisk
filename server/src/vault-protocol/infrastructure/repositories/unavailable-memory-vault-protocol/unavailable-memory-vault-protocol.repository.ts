import { Injectable } from '@nestjs/common';
import { DomainError } from '@budget/domain';

/** Vault v2 is PostgreSQL-only; unsupported memory mode must fail closed. */
@Injectable()
export class UnavailableMemoryVaultProtocolRepository {
  private unavailable(): never {
    throw new DomainError('Vault protocol persistence is unavailable');
  }

  create(..._args: ReadonlyArray<unknown>): never {
    return this.unavailable();
  }
  consume(..._args: ReadonlyArray<unknown>): never {
    return this.unavailable();
  }
  enroll(..._args: ReadonlyArray<unknown>): never {
    return this.unavailable();
  }
  issue(..._args: ReadonlyArray<unknown>): never {
    return this.unavailable();
  }
  findLatest(..._args: ReadonlyArray<unknown>): never {
    return this.unavailable();
  }
  saveIfCurrent(..._args: ReadonlyArray<unknown>): never {
    return this.unavailable();
  }
  get(..._args: ReadonlyArray<unknown>): never {
    return this.unavailable();
  }
  list(..._args: ReadonlyArray<unknown>): never {
    return this.unavailable();
  }
  revoke(..._args: ReadonlyArray<unknown>): never {
    return this.unavailable();
  }
  rotate(..._args: ReadonlyArray<unknown>): never {
    return this.unavailable();
  }
  enablePasskeyUnlock(..._args: ReadonlyArray<unknown>): never {
    return this.unavailable();
  }
  enableHighSecurity(..._args: ReadonlyArray<unknown>): never {
    return this.unavailable();
  }
  disableHighSecurity(..._args: ReadonlyArray<unknown>): never {
    return this.unavailable();
  }
  findActiveByCredentialId(..._args: ReadonlyArray<unknown>): never {
    return this.unavailable();
  }
  listActiveByUserId(..._args: ReadonlyArray<unknown>): never {
    return this.unavailable();
  }
  updateCounter(..._args: ReadonlyArray<unknown>): never {
    return this.unavailable();
  }
}
