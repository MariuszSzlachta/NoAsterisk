import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Server } from 'node:http';
import request from 'supertest';
import { ConfirmRecoveryRegistrationHandler } from '@vault-protocol/application/commands/confirm-recovery-registration';
import { PrepareRecoveryRegistrationHandler } from '@vault-protocol/application/commands/prepare-recovery-registration';
import { RecoveryAuthorityRegistration } from '@vault-protocol/domain/entities/recovery-authority-registration';
import { RecoveryRegistrationController } from '@vault-protocol/presentation/controllers/recovery-registration';
import { buildRecoveryRegistration } from '@vault-protocol/testing/build-recovery-registration';
import { buildRecoveryRegistrationCommand } from '@vault-protocol/testing/build-recovery-registration-command';

describe('recovery registration HTTP contract', () => {
  let app: INestApplication<Server>;
  const command = buildRecoveryRegistrationCommand();
  const snapshot = buildRecoveryRegistration();
  const prepare: Pick<PrepareRecoveryRegistrationHandler, 'execute'> = {
    execute: jest.fn(async () => new RecoveryAuthorityRegistration(snapshot)),
  };
  const confirm: Pick<ConfirmRecoveryRegistrationHandler, 'execute'> = {
    execute: jest.fn(async () => undefined),
  };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [RecoveryRegistrationController],
      providers: [
        { provide: PrepareRecoveryRegistrationHandler, useValue: prepare },
        { provide: ConfirmRecoveryRegistrationHandler, useValue: confirm },
      ],
    }).compile();
    app = module.createNestApplication<INestApplication<Server>>();
    app.use((incoming: object, _response: unknown, next: () => void): void => {
      Object.assign(incoming, { user: command.user });
      next();
    });
    await app.listen(0, '127.0.0.1');
  });
  afterEach(() => {
    jest.clearAllMocks();
  });
  afterAll(async () => {
    await app.close();
    jest.restoreAllMocks();
  });

  it('should return public challenge context and derive authenticated account ownership outside the body', async () => {
    const payload = {
      vaultId: command.vaultId,
      keyId: command.keyId,
      deviceId: command.deviceId,
      recoveryPublicKey: snapshot.recoveryPublicKey,
      recoveryConfirmed: true,
    };
    const response = await request(app.getHttpServer())
      .post('/users/me/vault/recovery-authority/prepare')
      .send(payload)
      .expect(201);
    expect(response.body).toEqual({
      accountId: snapshot.userId,
      workspaceId: snapshot.workspaceId,
      vaultId: snapshot.vaultId,
      keyId: snapshot.keyId,
      deviceId: snapshot.deviceId,
      challenge: snapshot.challenge,
      expiresAt: '1970-01-01T00:01:01.000Z',
      signingPublicKey: snapshot.signingPublicKey,
      recoveryPublicKey: snapshot.recoveryPublicKey,
    });
    expect(prepare.execute).toHaveBeenCalledWith({
      user: command.user,
      vaultId: command.vaultId,
      keyId: command.keyId,
      deviceId: command.deviceId,
      recoveryPublicKey: snapshot.recoveryPublicKey,
    });
  });

  it('should pass only the validated proof transcript to confirmation', async () => {
    const payload = {
      vaultId: command.vaultId,
      keyId: command.keyId,
      deviceId: command.deviceId,
      challenge: command.challenge,
      deviceSignature: command.deviceSignature,
      recoverySignature: command.recoverySignature,
    };
    await request(app.getHttpServer())
      .post('/users/me/vault/recovery-authority/confirm')
      .send(payload)
      .expect(201);
    expect(confirm.execute).toHaveBeenCalledWith(command);
  });

  it('should reject private roots and account overrides before invoking any handler', async () => {
    const payload = {
      vaultId: command.vaultId,
      keyId: command.keyId,
      deviceId: command.deviceId,
      recoveryPublicKey: snapshot.recoveryPublicKey,
      recoveryConfirmed: true,
    };
    await request(app.getHttpServer())
      .post('/users/me/vault/recovery-authority/prepare')
      .send({ ...payload, recoverySeed: 'private-input-forbidden' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/users/me/vault/recovery-authority/prepare')
      .send({ ...payload, userId: command.user.userId })
      .expect(400);
    expect(prepare.execute).not.toHaveBeenCalled();
    expect(confirm.execute).not.toHaveBeenCalled();
  });
});
