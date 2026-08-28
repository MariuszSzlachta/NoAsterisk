export interface DataBoundaries {
  readonly headerRow: number | null;
  readonly dataStartRow: number;
  readonly skipRows: number;
  readonly dataText: string;
}
