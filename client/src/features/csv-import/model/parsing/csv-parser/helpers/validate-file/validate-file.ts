import { CsvParseError } from '#features/csv-import/model/parsing/csv-parser/helpers/csv-parse-error';
import { CSV_EXTENSION } from '#features/csv-import/model/parsing/csv-parser/helpers/validate-file/constants/csv-extension';
import { ERROR_CODE_EMPTY_FILE } from '#features/csv-import/model/parsing/csv-parser/helpers/validate-file/constants/error-code-empty-file';
import { ERROR_CODE_FILE_TOO_LARGE } from '#features/csv-import/model/parsing/csv-parser/helpers/validate-file/constants/error-code-file-too-large';
import { ERROR_CODE_INVALID_EXTENSION } from '#features/csv-import/model/parsing/csv-parser/helpers/validate-file/constants/error-code-invalid-extension';
import { MAX_FILE_SIZE_BYTES } from '#features/csv-import/model/parsing/csv-parser/helpers/validate-file/constants/max-file-size-bytes';

export const validateFile = (file: File): void => {
  if (!file.name.toLowerCase().endsWith(CSV_EXTENSION)) {
    throw new CsvParseError(
      'Only .csv files are supported',
      ERROR_CODE_INVALID_EXTENSION,
    );
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new CsvParseError('File exceeds 10 MB limit', ERROR_CODE_FILE_TOO_LARGE);
  }
  if (file.size === 0) {
    throw new CsvParseError('File is empty', ERROR_CODE_EMPTY_FILE);
  }
};
