import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Server } from 'node:http';
import request from 'supertest';
import { json } from 'express';
import { PrepareDualRootRotationHandler } from '@vault-protocol/application/commands/prepare-dual-root-rotation';
import { FinalizeDualRootRotationHandler } from '@vault-protocol/application/commands/finalize-dual-root-rotation';
import { DualRootRotationController } from '@vault-protocol/presentation/controllers/dual-root-rotation';
import { buildVaultRotationTranscript } from '@vault-protocol/testing/buildVaultRotationTranscript';
import { buildVaultSignatureFixture } from '@vault-protocol/testing/build-vault-signature-fixture';
import { signVaultRotation } from '@vault-protocol/testing/signVaultRotation';
import { mapRotationTranscriptToResponse } from '@vault-protocol/application/mappers/mapRotationTranscriptToResponse';
import type { PrepareRotationDto } from '@vault-protocol/presentation/dto/dual-root-rotation/types';

describe('dual-root rotation HTTP contract', () => {
  let app: INestApplication<Server>;
  const transcript = buildVaultRotationTranscript();
  const signed = signVaultRotation(transcript, buildVaultSignatureFixture());
  const prepare: Pick<PrepareDualRootRotationHandler, 'execute'> = {
    execute: jest.fn().mockResolvedValue(transcript),
  };
  const finalize: Pick<FinalizeDualRootRotationHandler, 'execute'> = {
    execute: jest.fn().mockResolvedValue(undefined),
  };
  const body: PrepareRotationDto = {
    vaultId: transcript.snapshot.vaultId,
    deviceId: transcript.snapshot.deviceId,
    currentKeyId: transcript.snapshot.currentKeyId,
    nextKeyId: transcript.snapshot.nextKeyId,
    nextRecoveryPublicKey: transcript.snapshot.nextRecoveryPublicKey,
    signingPublicKey: transcript.snapshot.signingPublicKey,
    envelopePurpose: transcript.snapshot.envelopePurpose,
    envelope: transcript.snapshot.envelope,
  };
  const finalBody = {
    transcript: mapRotationTranscriptToResponse(transcript),
    deviceSignature: signed.deviceSignature,
    recoverySignature: signed.recoverySignature,
  };
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [DualRootRotationController],
      providers: [
        { provide: PrepareDualRootRotationHandler, useValue: prepare },
        { provide: FinalizeDualRootRotationHandler, useValue: finalize },
      ],
    }).compile();
    app = module.createNestApplication<INestApplication<Server>>({
      logger: false,
    });
    app.use(json({ limit: '10mb' }));
    app.use((incoming: object, _response: unknown, next: () => void): void => {
      Object.assign(incoming, { user: signed.user });
      next();
    });
    await app.listen(0, '127.0.0.1');
  });
  afterEach(() => jest.clearAllMocks());
  afterAll(async () => {
    await app.close();
    jest.restoreAllMocks();
  });
  it('should map the public prepare response and authenticated scope', async () => {
    const response = await request(app.getHttpServer())
      .post('/users/me/vault/rotate/prepare')
      .send(body)
      .expect(201);
    expect(response.body).toEqual(mapRotationTranscriptToResponse(transcript));
    expect(prepare.execute).toHaveBeenCalledWith({
      ...body,
      user: signed.user,
    });
  });
  it('should map finalize timestamp without exposing roots', async () => {
    await request(app.getHttpServer())
      .post('/users/me/vault/rotate/finalize')
      .send(finalBody)
      .expect(201);
    expect(finalize.execute).toHaveBeenCalledWith({
      ...signed,
      transcript: transcript.snapshot,
    });
  });
  it.each([
    { deviceSignature: 'bad' },
    { recoverySignature: 'g'.repeat(128) },
    { recoveryBackup: 'secret' },
    { transcript: { ...finalBody.transcript, deviceId: 'x'.repeat(129) } },
    { transcript: { ...finalBody.transcript, challenge: '!'.repeat(43) } },
    {
      transcript: {
        ...finalBody.transcript,
        nextKeyId: transcript.snapshot.currentKeyId,
      },
    },
    {
      transcript: {
        ...finalBody.transcript,
        envelopePurpose: 'passkey-wrap',
        passkeyEnvelope: 'secondary',
      },
    },
  ])(
    'should reject malformed finalize input before invoking application',
    async (overrides) => {
      await request(app.getHttpServer())
        .post('/users/me/vault/rotate/finalize')
        .send({ ...finalBody, ...overrides })
        .expect(400);
      expect(finalize.execute).not.toHaveBeenCalled();
    },
  );
  it('should reject oversized envelopes before invoking application', async () => {
    await request(app.getHttpServer())
      .post('/users/me/vault/rotate/finalize')
      .send({
        ...finalBody,
        transcript: {
          ...finalBody.transcript,
          envelope: 'x'.repeat(128 * 1024 + 1),
        },
      })
      .expect(400);
    expect(finalize.execute).not.toHaveBeenCalled();
  });
  it.each([
    { accountId: 'override' },
    { nextRecoveryPublicKey: 'bad' },
    { envelope: '' },
    { deviceId: 'x'.repeat(129) },
  ])(
    'should reject malformed prepare input before invoking application',
    async (overrides) => {
      await request(app.getHttpServer())
        .post('/users/me/vault/rotate/prepare')
        .send({ ...body, ...overrides })
        .expect(400);
      expect(prepare.execute).not.toHaveBeenCalled();
    },
  );
});
