import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Server } from 'node:http';
import request from 'supertest';
import { PrepareSignedEnrollmentHandler } from '@vault-protocol/application/commands/prepare-signed-enrollment';
import { FinalizeSignedEnrollmentHandler } from '@vault-protocol/application/commands/finalize-signed-enrollment';
import { ConfirmSignedEnrollmentHandler } from '@vault-protocol/application/commands/confirm-signed-enrollment';
import { SIGNED_ENROLLMENT_REPOSITORY } from '@vault-protocol/domain/ports/signed-enrollment';
import { SignedEnrollmentController } from '@vault-protocol/presentation/controllers/signed-enrollment';
import { buildRecoveryRegistrationCommand } from '@vault-protocol/testing/build-recovery-registration-command';
import { buildSignedEnrollmentRepositoryDouble } from '@vault-protocol/testing/build-signed-enrollment-repository-double';

describe('signed enrollment HTTP contract with real handlers', () => {
  let app: INestApplication<Server>;
  let user = buildRecoveryRegistrationCommand().user;
  const repository = buildSignedEnrollmentRepositoryDouble();
  const intent = {
    purpose: 'recovery',
    vaultId: '12345678-1234-4234-8234-123456789abc',
    keyId: 'key',
    deviceId: 'device',
    signingPublicKey: '{}',
    recoveryPublicKey: 'a'.repeat(64),
  };
  const finalize = {
    purpose: 'recovery',
    vaultId: intent.vaultId,
    keyId: intent.keyId,
    deviceId: intent.deviceId,
    challenge: 'A'.repeat(43),
    deviceEnvelope: '{}',
    passkeyEnvelope: '{}',
    deviceSignature: 'a'.repeat(128),
    recoverySignature: 'b'.repeat(128),
  };
  const confirmation = {
    vaultId: intent.vaultId,
    keyId: intent.keyId,
    deviceId: intent.deviceId,
    challenge: finalize.challenge,
    digest: 'c'.repeat(64),
    signature: 'a'.repeat(128),
  };
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [SignedEnrollmentController],
      providers: [
        PrepareSignedEnrollmentHandler,
        FinalizeSignedEnrollmentHandler,
        ConfirmSignedEnrollmentHandler,
        { provide: SIGNED_ENROLLMENT_REPOSITORY, useValue: repository },
      ],
    }).compile();
    app = module.createNestApplication<INestApplication<Server>>();
    // A synthetic trusted context isolates the HTTP/handler contract; JWT and throttling are separate release gates.
    app.use((incoming: object, _response: unknown, next: () => void): void => {
      Object.assign(incoming, { user });
      next();
    });
    await app.listen(0, '127.0.0.1');
  });
  beforeEach(() => {
    jest.clearAllMocks();
    user = buildRecoveryRegistrationCommand().user;
  });
  afterEach(() => jest.restoreAllMocks());
  afterAll(async () => {
    await app.close();
  });

  it('should map only public preparation fields and derive both account and workspace through the real handler', async () => {
    const prepare = jest.spyOn(repository, 'prepare');
    const response = await request(app.getHttpServer())
      .post('/users/me/vault/enrollment/v2/prepare')
      .send({ recoveryConfirmed: true, intent })
      .expect(201);
    expect(response.body).toEqual({
      serverShare: Buffer.alloc(32).toString('base64'),
      intent: {
        ...intent,
        accountId: user.userId,
        workspaceId: user.workspaceId,
        challenge: 'A'.repeat(43),
        createdAt: 1_000,
        expiresAt: 61_000,
        deviceEnvelope: '{}',
      },
    });
    expect(prepare).toHaveBeenCalledWith(
      { ...intent, accountId: user.userId, workspaceId: user.workspaceId },
      (user.authTime ?? 0) + 300_000,
    );
  });

  it('should preserve full finalized envelopes, signatures and the digest-bound signed confirmation', async () => {
    const finalized = jest.spyOn(repository, 'finalize');
    const confirmed = jest.spyOn(repository, 'confirm');
    await request(app.getHttpServer())
      .post('/users/me/vault/enrollment/v2/finalize')
      .send(finalize)
      .expect(201);
    await request(app.getHttpServer())
      .post('/users/me/vault/enrollment/v2/confirm')
      .send(confirmation)
      .expect(201);
    expect(finalized).toHaveBeenCalledWith({
      ...finalize,
      accountId: user.userId,
      workspaceId: user.workspaceId,
      authDeadline: (user.authTime ?? 0) + 300_000,
    });
    expect(confirmed).toHaveBeenCalledWith({
      ...confirmation,
      accountId: user.userId,
      workspaceId: user.workspaceId,
      authDeadline: (user.authTime ?? 0) + 300_000,
    });
  });

  it('should reject private roots, context overrides and unsigned confirmation before invoking any port', async () => {
    const prepare = jest.spyOn(repository, 'prepare');
    const finalized = jest.spyOn(repository, 'finalize');
    const confirmed = jest.spyOn(repository, 'confirm');
    await request(app.getHttpServer())
      .post('/users/me/vault/enrollment/v2/prepare')
      .send({
        recoveryConfirmed: true,
        intent: { ...intent, recoverySeed: 'secret' },
      })
      .expect(400);
    await request(app.getHttpServer())
      .post('/users/me/vault/enrollment/v2/finalize')
      .send({ ...finalize, accountId: 'other' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/users/me/vault/enrollment/v2/confirm')
      .send({
        challenge: confirmation.challenge,
        deviceId: confirmation.deviceId,
      })
      .expect(400);
    expect(prepare).not.toHaveBeenCalled();
    expect(finalized).not.toHaveBeenCalled();
    expect(confirmed).not.toHaveBeenCalled();
  });

  it('should reject expired interactive auth and leave the unsigned legacy endpoints unavailable', async () => {
    const prepare = jest.spyOn(repository, 'prepare');
    user = { ...user, authTime: Date.now() - 360_000 };
    await request(app.getHttpServer())
      .post('/users/me/vault/enrollment/v2/prepare')
      .send({ recoveryConfirmed: true, intent })
      .expect(401);
    for (const action of ['prepare', 'finalize', 'confirm']) {
      await request(app.getHttpServer())
        .post(`/users/me/vault/enrollment/${action}`)
        .send({})
        .expect(404);
    }
    expect(prepare).not.toHaveBeenCalled();
  });
});
