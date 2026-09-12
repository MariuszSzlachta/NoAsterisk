import { useEffect, useRef } from 'react';

interface BarcodeDetectorLike {
  detect: (
    source: HTMLVideoElement,
  ) => Promise<ReadonlyArray<{ rawValue?: string }>>;
}

interface BarcodeDetectorConstructorLike {
  new (options?: { formats?: ReadonlyArray<string> }): BarcodeDetectorLike;
}

interface TrustedDeviceQrScannerProps {
  readonly onScan: (value: string) => void;
  readonly onError: (error: string) => void;
  readonly active: boolean;
}

const getDetector = (): BarcodeDetectorLike | undefined => {
  const constructor = (
    globalThis as typeof globalThis & {
      BarcodeDetector?: BarcodeDetectorConstructorLike;
    }
  ).BarcodeDetector;
  return constructor === undefined
    ? undefined
    : new constructor({ formats: ['qr_code'] });
};

export const TrustedDeviceQrScanner = ({
  onScan,
  onError,
  active,
}: TrustedDeviceQrScannerProps): React.JSX.Element => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onScanRef = useRef(onScan);
  const onErrorRef = useRef(onError);
  onScanRef.current = onScan;
  onErrorRef.current = onError;

  useEffect(() => {
    if (!active) return;
    const video = videoRef.current;
    const detector = getDetector();
    if (
      video === null ||
      detector === undefined ||
      navigator.mediaDevices?.getUserMedia === undefined
    ) {
      onErrorRef.current('QR scanning is not supported in this browser');
      return;
    }
    let cancelled = false;
    let frame = 0;
    let stream: MediaStream | undefined;
    const stop = (): void => {
      cancelled = true;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
    };
    const scan = async (): Promise<void> => {
      if (cancelled) return;
      try {
        const results = await detector.detect(video);
        if (cancelled) return;
        const value = results.find(
          (result) =>
            typeof result.rawValue === 'string' && result.rawValue.length > 0,
        )?.rawValue;
        if (value !== undefined) {
          onScanRef.current(value);
          stop();
          return;
        }
      } catch {
        // A frame can be unavailable while the camera is starting; retry safely.
      }
      if (!cancelled) frame = requestAnimationFrame(() => void scan());
    };
    void (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        video.srcObject = stream;
        await video.play();
        if (cancelled) return;
        frame = requestAnimationFrame(() => void scan());
      } catch {
        const wasCancelled = cancelled;
        stop();
        if (!wasCancelled)
          onErrorRef.current(
            'Camera permission is required to scan the QR code',
          );
      }
    })();
    return () => {
      stop();
    };
  }, [active]);

  return (
    <video
      ref={videoRef}
      className="mx-auto aspect-square w-full rounded-md bg-black object-cover"
      muted
      playsInline
      aria-label="Trusted-device QR scanner"
    />
  );
};
