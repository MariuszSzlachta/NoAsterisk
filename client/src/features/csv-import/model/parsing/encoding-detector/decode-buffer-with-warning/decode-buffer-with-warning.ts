import type { DecodeWarning } from '#features/csv-import/model/parsing/types/decode-warning';

import { countReplacementChars } from '#features/csv-import/model/parsing/encoding-detector/helpers/count-replacement-chars';
import { decodeBuffer } from '#features/csv-import/model/parsing/encoding-detector/decode-buffer';

export const decodeBufferWithWarning = (
  buffer: ArrayBuffer,
  encoding: string,
): { text: string; warning: DecodeWarning | undefined } => {
  const text = decodeBuffer(buffer, encoding);
  const replacementCharCount = countReplacementChars(text);

  if (replacementCharCount === 0) {
    return { text, warning: undefined };
  }

  return {
    text,
    warning: {
      replacementCharCount,
      message: `Detected ${replacementCharCount} unreadable character(s). The file encoding may be incorrect (detected: ${encoding}).`,
    },
  };
};
