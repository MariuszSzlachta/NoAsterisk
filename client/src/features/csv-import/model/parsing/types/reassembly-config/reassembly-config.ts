export interface ReassemblyConfig {
  readonly expectedColumnCount: number;
  readonly separator: string;
  readonly overflowColumnIndex?: number;
  readonly fixedTailColumns?: number;
}
