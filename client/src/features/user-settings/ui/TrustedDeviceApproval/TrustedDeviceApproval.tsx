import { useTrustedDeviceApproval } from '#features/user-settings/ui/hooks/useTrustedDeviceApproval';
import { TrustedDeviceApprovalResponse } from '#features/user-settings/ui/TrustedDeviceApprovalResponse';
import { Button } from '#shared/ui/Button';
import { Card, CardHeader } from '#shared/ui/Card';
import { TrustedDeviceQrScanner } from '#shared/ui/TrustedDeviceQrScanner';

export const TrustedDeviceApproval = (): React.JSX.Element => {
  const {
    data,
    handleStart,
    handleCancel,
    handleApprove,
    handleScan,
    handleScanError,
  } = useTrustedDeviceApproval();
  return (
    <Card>
      <CardHeader title={data.title} subtitle={data.description} />
      {data.isScanning && (
        <div className="mb-3 space-y-2">
          <TrustedDeviceQrScanner
            active
            onScan={handleScan}
            onError={handleScanError}
          />
          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
            className="w-full"
          >
            {data.stopLabel}
          </Button>
        </div>
      )}
      {data.response !== undefined && (
        <div className="space-y-3">
          <TrustedDeviceApprovalResponse data={data.response} />
          <Button type="button" variant="secondary" onClick={handleCancel}>
            {data.cancelLabel}
          </Button>
        </div>
      )}
      {data.isConfirming && (
        <div
          className="mb-3 space-y-2"
          role="group"
          aria-label={data.confirmationLabel}
        >
          <p className="break-words text-xs text-muted-foreground">
            {data.confirmationLabel}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={handleApprove}
              disabled={data.isGenerating}
            >
              {data.approveLabel}
            </Button>
            <Button type="button" variant="secondary" onClick={handleCancel}>
              {data.cancelLabel}
            </Button>
          </div>
        </div>
      )}
      {data.error !== undefined && (
        <p role="alert" className="mb-3 text-xs text-destructive">
          {data.error}
        </p>
      )}
      {data.isIdle && (
        <Button type="button" variant="secondary" onClick={handleStart}>
          {data.startLabel}
        </Button>
      )}
    </Card>
  );
};
