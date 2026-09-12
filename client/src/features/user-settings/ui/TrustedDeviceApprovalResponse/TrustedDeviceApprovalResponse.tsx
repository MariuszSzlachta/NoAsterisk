import type { TrustedDeviceApprovalResponseView } from '#features/user-settings/model/trusted-device-approval/types';

interface Props {
  readonly data: TrustedDeviceApprovalResponseView;
}
export const TrustedDeviceApprovalResponse = ({
  data,
}: Props): React.JSX.Element => (
  <div className="mb-3 space-y-2">
    <p className="text-xs text-muted-foreground">{data.label}</p>
    <div
      className="mx-auto w-full max-w-sm rounded-md bg-surface p-3 [&_svg]:block [&_svg]:h-auto [&_svg]:w-full"
      role="img"
      aria-label={data.label}
      dangerouslySetInnerHTML={data.markup}
    />
  </div>
);
