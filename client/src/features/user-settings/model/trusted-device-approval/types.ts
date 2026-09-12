import type { SignedTrustedRequest } from '#shared/adapters/vault-protocol/signed-trusted-enrollment';

export type TrustedDeviceApprovalPhase =
  | { readonly kind: 'idle' }
  | { readonly kind: 'scanning' }
  | { readonly kind: 'confirm'; readonly request: SignedTrustedRequest }
  | { readonly kind: 'generating'; readonly request: SignedTrustedRequest }
  | { readonly kind: 'response'; readonly markup: { readonly __html: string } };
export interface TrustedDeviceApprovalState {
  readonly phase: TrustedDeviceApprovalPhase;
  readonly error: string | undefined;
  readonly setPhase: (phase: TrustedDeviceApprovalPhase) => void;
  readonly setError: (error: string | undefined) => void;
  readonly reset: () => void;
}
export interface TrustedDeviceApprovalResponseView {
  readonly markup: { readonly __html: string };
  readonly label: string;
}
