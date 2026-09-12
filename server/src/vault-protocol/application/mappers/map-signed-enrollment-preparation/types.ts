interface EnrollmentPreparationContext {
  readonly accountId: string;
  readonly workspaceId: string;
  readonly vaultId: string;
  readonly keyId: string;
  readonly deviceId: string;
  readonly signingPublicKey: string;
  readonly challenge: string;
  readonly createdAt: number;
  readonly expiresAt: number;
  readonly deviceEnvelope: string;
}
export interface EnrollmentPreparationView {
  readonly serverShare: string;
  readonly intent: EnrollmentPreparationContext &
    (
      | {
          readonly purpose: 'initial' | 'recovery';
          readonly recoveryPublicKey: string;
        }
      | {
          readonly purpose: 'trusted';
          readonly oldDeviceId: string;
          readonly newEphemeralPublicKey: string;
          readonly delegationDigest: string;
        }
    );
}
