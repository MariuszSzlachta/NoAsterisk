import type { TrustedDeviceApprovalResponseView } from '#features/user-settings/model/trusted-device-approval/types';

export interface TrustedDeviceApprovalHookResult {
  readonly handleStart: () => void;
  readonly handleCancel: () => void;
  readonly handleApprove: () => void;
  readonly handleScan: (text: string) => void;
  readonly handleScanError: (message: string) => void;
  readonly data: {
    readonly isScanning: boolean;
    readonly isIdle: boolean;
    readonly isConfirming: boolean;
    readonly isGenerating: boolean;
    readonly confirmationLabel: string;
    readonly title: string;
    readonly description: string;
    readonly startLabel: string;
    readonly stopLabel: string;
    readonly approveLabel: string;
    readonly cancelLabel: string;
    readonly response: TrustedDeviceApprovalResponseView | undefined;
    readonly error: string | undefined;
  };
}
