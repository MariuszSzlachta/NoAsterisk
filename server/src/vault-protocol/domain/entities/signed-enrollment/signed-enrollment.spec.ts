import { DomainError } from '@budget/domain';
import { SignedEnrollment } from '@vault-protocol/domain/entities/signed-enrollment';
import type { SignedEnrollmentAuthority } from '@vault-protocol/domain/entities/signed-enrollment';
import { buildEnrollmentTranscript } from '@vault-protocol/testing/build-enrollment-transcript';

describe('one-use signed enrollment lifecycle', () => {
  it('should permit replacing only an expired pending binding in exactly the same scope', () => {
    const intent = buildEnrollmentTranscript();
    const pending = new SignedEnrollment({
      intent,
      state: { kind: 'pending' },
    });
    const binding = { ...intent, status: 'pending', isRevoked: false };
    expect(() => {
      pending.assertPendingDeviceReplacement(binding, false);
    }).not.toThrow();
    expect(() => {
      pending.assertPendingDeviceReplacement(binding, true);
    }).toThrow(DomainError);
    for (const substitution of [
      { status: 'active' },
      { status: 'high-security' },
      { isRevoked: true },
      { accountId: 'other' },
      { workspaceId: 'other' },
      { vaultId: 'other' },
      { keyId: 'other' },
      { deviceId: 'other' },
    ]) {
      expect(() => {
        pending.assertPendingDeviceReplacement(
          { ...binding, ...substitution },
          false,
        );
      }).toThrow(DomainError);
    }
    expect(() => {
      new SignedEnrollment({
        intent: { ...intent, purpose: 'initial' },
        state: { kind: 'pending' },
      }).assertPendingDeviceReplacement(binding, false);
    }).toThrow(DomainError);
  });
  it('should validate the prepared share and return independently owned copies', () => {
    const intent = buildEnrollmentTranscript();
    const bytes = new Uint8Array(32).fill(7);
    const enrollment = new SignedEnrollment(
      { intent, state: { kind: 'pending' } },
      bytes,
    );
    bytes.fill(0);
    const copy = enrollment.copyPreparedShare();
    expect(copy[0]).toBe(7);
    copy.fill(0);
    expect(enrollment.copyPreparedShare()[0]).toBe(7);
    expect(
      () =>
        new SignedEnrollment(
          { intent, state: { kind: 'pending' } },
          new Uint8Array(31),
        ),
    ).toThrow(DomainError);
    expect(() =>
      new SignedEnrollment({
        intent,
        state: { kind: 'pending' },
      }).copyPreparedShare(),
    ).toThrow(DomainError);
  });
  it('should preserve all public context across consume/activate and reject replay or wrong confirmation digest', () => {
    const intent = buildEnrollmentTranscript();
    const pending = new SignedEnrollment({
      intent,
      state: { kind: 'pending' },
    });
    const digest = 'b'.repeat(64);
    const finalized = pending.consume(digest);
    expect(finalized.snapshot.intent).toEqual(intent);
    expect(() => finalized.consume(digest)).toThrow(DomainError);
    expect(() => finalized.activate('c'.repeat(64))).toThrow(DomainError);
    const active = finalized.activate(digest);
    expect(active.snapshot.intent).toEqual(intent);
    expect(active.snapshot.state).toEqual({ kind: 'active', digest });
    expect(() => active.activate(digest)).toThrow(DomainError);
    expect(() => pending.consume('B'.repeat(64))).toThrow(DomainError);
  });
  it('should enforce current authority independently of cryptographic possession', () => {
    const intent = buildEnrollmentTranscript();
    const recovery = new SignedEnrollment({
      intent,
      state: { kind: 'pending' },
    });
    const authority: SignedEnrollmentAuthority = {
      kind: 'existing',
      vaultId: intent.vaultId,
      keyId: intent.keyId,
      protocolVersion: '2',
      cryptoSuite: 'HKDF-SHA256/AES-256-GCM',
      recoveryPublicKey: intent.recoveryPublicKey,
      approver: undefined,
    };
    expect(() => {
      recovery.assertAuthority(authority);
    }).not.toThrow();
    expect(() => {
      recovery.assertAuthority({ ...authority, recoveryPublicKey: undefined });
    }).toThrow(DomainError);
    expect(() => {
      recovery.assertAuthority({ ...authority, keyId: 'other' });
    }).toThrow(DomainError);
    expect(() => {
      recovery.assertAuthority({ kind: 'empty' });
    }).toThrow(DomainError);
    const initial = new SignedEnrollment({
      intent: { ...intent, purpose: 'initial' },
      state: { kind: 'pending' },
    });
    expect(() => {
      initial.assertAuthority({ kind: 'empty' });
    }).not.toThrow();
    expect(() => {
      initial.assertAuthority(authority);
    }).toThrow(DomainError);
  });
  it('should enforce scope, challenge/purpose and freshness for finalized envelopes', () => {
    const intent = buildEnrollmentTranscript();
    const enrollment = new SignedEnrollment({
      intent,
      state: { kind: 'pending' },
    });
    const request = {
      ...intent,
      deviceEnvelope: '{"changed":true}',
      authDeadline: 61_000,
      deviceSignature: '0'.repeat(128),
      recoverySignature: '1'.repeat(128),
    };
    expect(enrollment.finalizeTranscript(request).snapshot.deviceEnvelope).toBe(
      request.deviceEnvelope,
    );
    expect(() =>
      enrollment.finalizeTranscript({ ...request, challenge: 'B'.repeat(43) }),
    ).toThrow(DomainError);
    expect(() =>
      enrollment.finalizeTranscript({ ...request, purpose: 'initial' }),
    ).toThrow(DomainError);
    expect(() => {
      enrollment.assertScope({ ...intent, workspaceId: 'other' });
    }).toThrow(DomainError);
    expect(() => {
      enrollment.assertLive(60_999, 60_999);
    }).not.toThrow();
    expect(() => {
      enrollment.assertLive(61_000, 61_000);
    }).toThrow(DomainError);
    expect(() => {
      enrollment.assertLive(60_999, 60_998);
    }).toThrow(DomainError);
  });
});
describe('prepared share disposal', () => {
  it('should invalidate share access while preserving the public intent and independent caller copies', () => {
    const enrollment = new SignedEnrollment(
      { intent: buildEnrollmentTranscript(), state: { kind: 'pending' } },
      new Uint8Array(32).fill(7),
    );
    const snapshot = enrollment.snapshot;
    const copy = enrollment.copyPreparedShare();
    enrollment.disposePreparedShare();
    enrollment.disposePreparedShare();
    expect(() => enrollment.copyPreparedShare()).toThrow(DomainError);
    expect(enrollment.snapshot).toEqual(snapshot);
    expect(copy[0]).toBe(7);
    copy.fill(0);
  });
});
