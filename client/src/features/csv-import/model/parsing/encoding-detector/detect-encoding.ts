import { detectCharset } from '#shared/adapters/encoding';

import { ENCODING_SEPARATOR_PATTERN } from '#features/csv-import/model/parsing/shared/patterns';

const SAMPLE_SIZE = 4096;
const CONFIDENCE_THRESHOLD = 0.8;
const FALLBACK_ENCODING = 'utf-8';

const UTF8_BOM = [0xef, 0xbb, 0xbf] as const;
const UTF16LE_BOM = [0xff, 0xfe] as const;
const UTF16BE_BOM = [0xfe, 0xff] as const;

/** Byte values typical for Windows-1250 encoded Polish text (ą, ę, ć, ł, ń, ó, ś, ź, ż) */
const WINDOWS_1250_INDICATOR_BYTES = [0xb9, 0xe6, 0xea, 0xb3, 0xf1, 0xf3, 0x9c, 0x9f, 0xbf] as const;

export const SUPPORTED_ENCODINGS = ['utf-8', 'windows-1250', 'iso-8859-2', 'ascii'] as const;

export const normalizeEncoding = (detected: string): string => {
  const lower = detected.toLowerCase().replace(ENCODING_SEPARATOR_PATTERN, '');
  if (lower.includes('1250') || lower === 'windows1250') return 'windows-1250';
  if (lower.includes('1252') || lower === 'windows1252') return 'windows-1250'; // PL-focused: Polish bank CSVs mislabeled as 1252 by jschardet
  if (lower.includes('88592') || lower === 'iso88592' || lower === 'latin2') return 'iso-8859-2';
  if (lower === 'ascii' || lower === 'usascii') return 'utf-8';
  if (lower.includes('utf8') || lower === 'utf8') return 'utf-8';
  return detected.toLowerCase();
};

export const matchesBom = (bytes: Uint8Array, bom: readonly number[]): boolean =>
  bom.every((b, i) => bytes[i] === b);

export const detectEncoding = (buffer: ArrayBuffer): string => {
  const sample = buffer.slice(0, Math.min(buffer.byteLength, SAMPLE_SIZE));
  const bytes = new Uint8Array(sample);

  if (matchesBom(bytes, UTF8_BOM)) return 'utf-8';
  if (matchesBom(bytes, UTF16LE_BOM)) return 'utf-16le';
  if (matchesBom(bytes, UTF16BE_BOM)) return 'utf-16be';

  const binaryStr = Array.from(bytes)
    .map((b) => String.fromCharCode(b))
    .join('');
  const result = detectCharset(binaryStr);

  if (result.confidence >= CONFIDENCE_THRESHOLD) {
    return normalizeEncoding(result.encoding);
  }

  if (bytes.some((b) => (WINDOWS_1250_INDICATOR_BYTES as readonly number[]).includes(b))) {
    return 'windows-1250';
  }

  return FALLBACK_ENCODING;
};
