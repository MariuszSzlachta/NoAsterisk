import { describe, expect, it, vi } from 'vitest';

vi.mock('#shared/adapters/encoding', () => ({
  detectCharset: vi.fn(() => ({ encoding: 'ascii', confidence: 0.1 })),
}));

import { detectEncoding } from './detect-encoding';

describe('detectEncoding (low-confidence fallback)', () => {
  it('falls back to windows-1250 when low confidence + Win-1250 indicator bytes', () => {
    const bytes = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f, 0xb9]).buffer;
    expect(detectEncoding(bytes)).toBe('windows-1250');
  });

  it('falls back to utf-8 when low confidence + no Win-1250 indicators', () => {
    const bytes = new Uint8Array([0x48, 0x65, 0x6c, 0x6c, 0x6f]).buffer;
    expect(detectEncoding(bytes)).toBe('utf-8');
  });

  it('still detects UTF-8 BOM regardless of confidence', () => {
    const bytes = new Uint8Array([0xef, 0xbb, 0xbf, 0x48, 0x65]).buffer;
    expect(detectEncoding(bytes)).toBe('utf-8');
  });
});
