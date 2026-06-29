import jschardet from 'jschardet';

export interface EncodingDetectionResult {
  readonly encoding: string;
  readonly confidence: number;
}

/**
 * Port interface — encoding detection adapter.
 * Current implementation: jschardet. Swappable without touching features.
 */
export const detectCharset = (binaryString: string): EncodingDetectionResult =>
  jschardet.detect(binaryString);
