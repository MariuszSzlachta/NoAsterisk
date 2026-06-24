export interface ColumnMappingDto {
  sourceColumn: string;
  targetField: string;
  isRequired: boolean;
}

export interface ParserConfigDto {
  delimiter: string;
  hasHeader: boolean;
  dateFormat: string;
  encoding: string;
}

export interface AnonymizationConfigDto {
  fieldsToAnonymize: string[];
  strategy: 'Hash' | 'Mask' | 'Remove';
}

export interface ImportProfileResponseDto {
  id: string;
  workspaceId: string;
  name: string;
  columnMappings: ColumnMappingDto[];
  parserConfig: ParserConfigDto;
  anonymizationConfig: AnonymizationConfigDto;
  createdAt: string;
  updatedAt: string;
}
