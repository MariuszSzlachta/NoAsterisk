import { CsvParseError } from './csv-parse-error';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export const validateFile = (file: File): void => {
  if (!file.name.toLowerCase().endsWith('.csv')) {
    throw new CsvParseError(
      'Only .csv files are supported',
      'INVALID_EXTENSION',
    );
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new CsvParseError('File exceeds 10 MB limit', 'FILE_TOO_LARGE');
  }
  if (file.size === 0) {
    throw new CsvParseError('File is empty', 'EMPTY_FILE');
  }
};
