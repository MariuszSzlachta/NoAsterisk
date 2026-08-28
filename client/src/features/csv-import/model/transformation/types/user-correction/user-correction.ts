export interface UserCorrection {
  readonly text: string;
  readonly action: 'accept' | 'reject';
  readonly detectorId: string;
  readonly timestamp: string;
}
