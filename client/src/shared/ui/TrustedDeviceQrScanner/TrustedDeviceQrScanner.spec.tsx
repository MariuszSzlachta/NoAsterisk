import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TrustedDeviceQrScanner } from './TrustedDeviceQrScanner';

describe('TrustedDeviceQrScanner', () => {
  it('reports unsupported browser capability and renders an accessible video', () => {
    const onError = vi.fn();
    render(
      <TrustedDeviceQrScanner
        active
        onScan={vi.fn()}
        onError={onError}
      />,
    );
    expect(screen.getByLabelText('Trusted-device QR scanner')).toBeInTheDocument();
    expect(onError).toHaveBeenCalledWith(
      'QR scanning is not supported in this browser',
    );
  });

  it('does not request camera access when inactive', () => {
    const getUserMedia = vi.fn();
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    });
    render(
      <TrustedDeviceQrScanner
        active={false}
        onScan={vi.fn()}
        onError={vi.fn()}
      />,
    );
    expect(getUserMedia).not.toHaveBeenCalled();
  });

  it('requests the camera and forwards the first decoded QR value', async () => {
    const onScan = vi.fn();
    const stop = vi.fn();
    const play = vi
      .spyOn(HTMLMediaElement.prototype, 'play')
      .mockResolvedValue(undefined);
    const getUserMedia = vi.fn().mockResolvedValue({
      getTracks: () => [{ stop }],
    });
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    });
    vi.stubGlobal(
      'BarcodeDetector',
      class {
        detect = vi.fn().mockResolvedValue([{ rawValue: 'budgetflow-qr-payload' }]);
      },
    );
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0);
      return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());

    const view = render(
      <TrustedDeviceQrScanner
        active
        onScan={onScan}
        onError={vi.fn()}
      />,
    );

    await waitFor(() => expect(onScan).toHaveBeenCalledWith('budgetflow-qr-payload'));
    expect(getUserMedia).toHaveBeenCalledWith({
      video: { facingMode: { ideal: 'environment' } },
      audio: false,
    });
    expect(stop).toHaveBeenCalled();
    view.unmount();
    play.mockRestore();
    vi.unstubAllGlobals();
  });

  it('reports a camera permission failure without exposing the browser error', async () => {
    const onError = vi.fn();
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: vi.fn().mockRejectedValue(new Error('private browser detail')) },
    });
    vi.stubGlobal(
      'BarcodeDetector',
      class {
        detect = vi.fn();
      },
    );

    render(
      <TrustedDeviceQrScanner
        active
        onScan={vi.fn()}
        onError={onError}
      />,
    );

    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith('Camera permission is required to scan the QR code'),
    );
    expect(onError).not.toHaveBeenCalledWith('private browser detail');
    vi.unstubAllGlobals();
  });
});
