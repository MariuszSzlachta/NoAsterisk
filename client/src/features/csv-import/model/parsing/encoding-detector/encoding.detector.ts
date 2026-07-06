import { detectCharset } from '#shared/adapters/encoding';

const SAMPLE_SIZE = 4096;
const CONFIDENCE_THRESHOLD = 0.8;
const FALLBACK_ENCODING = 'utf-8';

// Polish CSV exports commonly use these
const SUPPORTED_ENCODINGS = [
  'utf-8',
  'windows-1250',
  'iso-8859-2',
  'ascii',
] as const;

const normalizeEncoding = (detected: string): string => {
  const lower = detected.toLowerCase().replace(/[-_]/g, '');
  if (lower.includes('1250') || lower === 'windows1250') {
    return 'windows-1250';
  }
  if (lower.includes('1252') || lower === 'windows1252') {
    return 'windows-1250';
  } // PL-focused app: Polish bank CSVs mislabeled as 1252 by jschardet. Safe for PL/CEE context.
  if (lower.includes('88592') || lower === 'iso88592' || lower === 'latin2') {
    return 'iso-8859-2';
  }
  if (lower === 'ascii' || lower === 'usascii') {
    return 'utf-8';
  }
  if (lower.includes('utf8') || lower === 'utf8') {
    return 'utf-8';
  }
  return detected.toLowerCase();
};

/**
 * Detect encoding from raw file bytes.
 * Returns normalized encoding name suitable for TextDecoder.
 */
export const detectEncoding = (buffer: ArrayBuffer): string => {
  const sample = buffer.slice(0, Math.min(buffer.byteLength, SAMPLE_SIZE));
  const bytes = new Uint8Array(sample);

  // Check BOM first
  if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return 'utf-8';
  }
  if (bytes[0] === 0xff && bytes[1] === 0xfe) {
    return 'utf-16le';
  }
  if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    return 'utf-16be';
  }

  // Use jschardet on binary string
  const binaryStr = Array.from(bytes)
    .map((b) => String.fromCharCode(b))
    .join('');
  const result = detectCharset(binaryStr);

  if (result.confidence >= CONFIDENCE_THRESHOLD) {
    return normalizeEncoding(result.encoding);
  }

  // Low confidence fallback: check for common Windows-1250 patterns
  // Polish chars in Win-1250: ą=0xB9, ć=0xE6, ę=0xEA, ł=0xB3, ń=0xF1, ó=0xF3, ś=0x9C, ź=0x9F, ż=0xBF
  const win1250Chars = [0xb9, 0xe6, 0xea, 0xb3, 0xf1, 0xf3, 0x9c, 0x9f, 0xbf];
  const hasWin1250 = bytes.some((b) => win1250Chars.includes(b));
  if (hasWin1250) {
    return 'windows-1250';
  }

  return FALLBACK_ENCODING;
};

/**
 * Decode file buffer using detected or specified encoding.
 * Counts U+FFFD replacement characters that indicate encoding mismatch.
 */
export const decodeBuffer = (buffer: ArrayBuffer, encoding: string): string => {
  const decoder = new TextDecoder(encoding, { fatal: false });
  return decoder.decode(buffer);
};

/** Unicode replacement character inserted when decoding fails for a byte */
const REPLACEMENT_CHAR = '\uFFFD';

/**
 * Count replacement characters (U+FFFD) in decoded text.
 * Non-zero count indicates the chosen encoding may be wrong.
 */
export const countReplacementChars = (text: string): number => {
  let count = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === REPLACEMENT_CHAR) {
      count++;
    }
  }
  return count;
};

export interface DecodeWarning {
  readonly replacementCharCount: number;
  readonly message: string;
}

/**
 * Decode buffer and check for encoding issues.
 * Returns decoded text plus optional warning if replacement chars found.
 */
export const decodeBufferWithWarning = (
  buffer: ArrayBuffer,
  encoding: string,
): { text: string; warning: DecodeWarning | undefined } => {
  const text = decodeBuffer(buffer, encoding);
  const replacementCharCount = countReplacementChars(text);

  if (replacementCharCount > 0) {
    return {
      text,
      warning: {
        replacementCharCount,
        message: `Detected ${replacementCharCount} unreadable character(s). The file encoding may be incorrect (detected: ${encoding}).`,
      },
    };
  }

  return { text, warning: undefined };
};

export { SUPPORTED_ENCODINGS };
