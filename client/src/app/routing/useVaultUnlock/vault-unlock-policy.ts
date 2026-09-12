interface BootstrapEnvelopeState {
  readonly deviceEnvelope?: string;
  readonly passkeyEnvelope?: string;
  readonly securityProfile?: 'standard' | 'high-security';
}

const isHighSecurityBootstrap = (
  bootstrap: BootstrapEnvelopeState,
): boolean =>
  (bootstrap.securityProfile === 'high-security' ||
    (bootstrap.securityProfile === undefined &&
      bootstrap.deviceEnvelope === undefined)) &&
  bootstrap.passkeyEnvelope !== undefined;

const canFallbackToDeviceEnvelope = (
  bootstrap: BootstrapEnvelopeState,
): boolean =>
  !isHighSecurityBootstrap(bootstrap) &&
  bootstrap.deviceEnvelope !== undefined;

export const vaultUnlockPolicy = Object.freeze({
  isHighSecurityBootstrap,
  canFallbackToDeviceEnvelope,
});
