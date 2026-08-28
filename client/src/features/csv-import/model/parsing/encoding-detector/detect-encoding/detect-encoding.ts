import { detectCharset } from '#shared/adapters/encoding';

import { CONFIDENCE_THRESHOLD } from '#features/csv-import/model/parsing/encoding-detector/constants/confidence-threshold';
import { ENCODING_UTF16BE } from '#features/csv-import/model/parsing/encoding-detector/constants/encoding-utf16be';
import { ENCODING_UTF16LE } from '#features/csv-import/model/parsing/encoding-detector/constants/encoding-utf16le';
import { ENCODING_UTF8 } from '#features/csv-import/model/parsing/encoding-detector/constants/encoding-utf8';
import { ENCODING_WINDOWS_1250 } from '#features/csv-import/model/parsing/encoding-detector/constants/encoding-windows-1250';
import { FALLBACK_ENCODING } from '#features/csv-import/model/parsing/encoding-detector/constants/fallback-encoding';
import { SAMPLE_SIZE } from '#features/csv-import/model/parsing/encoding-detector/constants/sample-size';
import { UTF16BE_BOM } from '#features/csv-import/model/parsing/encoding-detector/constants/utf16be-bom';
import { UTF16LE_BOM } from '#features/csv-import/model/parsing/encoding-detector/constants/utf16le-bom';
import { UTF8_BOM } from '#features/csv-import/model/parsing/encoding-detector/constants/utf8-bom';
import { WINDOWS_1250_INDICATOR_BYTES } from '#features/csv-import/model/parsing/encoding-detector/constants/windows-1250-indicator-bytes';
import { matchesBom } from '#features/csv-import/model/parsing/encoding-detector/helpers/matches-bom';
import { normalizeEncoding } from '#features/csv-import/model/parsing/encoding-detector/helpers/normalize-encoding';

export const detectEncoding = (buffer: ArrayBuffer): string => {
  const sample = buffer.slice(0, Math.min(buffer.byteLength, SAMPLE_SIZE));
  const bytes = new Uint8Array(sample);

  if (matchesBom(bytes, UTF8_BOM)) {
    return ENCODING_UTF8;
  }
  if (matchesBom(bytes, UTF16LE_BOM)) {
    return ENCODING_UTF16LE;
  }
  if (matchesBom(bytes, UTF16BE_BOM)) {
    return ENCODING_UTF16BE;
  }

  const binaryStr = Array.from(bytes)
    .map((b) => String.fromCharCode(b))
    .join('');
  const result = detectCharset(binaryStr);

  if (result.confidence >= CONFIDENCE_THRESHOLD) {
    return normalizeEncoding(result.encoding);
  }

  if (bytes.some((b) => WINDOWS_1250_INDICATOR_BYTES.includes(b))) {
    return ENCODING_WINDOWS_1250;
  }

  return FALLBACK_ENCODING;
};
