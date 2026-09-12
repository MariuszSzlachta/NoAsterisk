import { describe, expect, it } from 'vitest';

import { createSignedTrustedFixture } from '#shared/adapters/vault-protocol/signed-trusted-enrollment/testing/create-signed-trusted-fixture';
import { renderSignedTrustedQr } from '#shared/adapters/vault-protocol/signed-trusted-qr/render';

describe('renderSignedTrustedQr', () => {
  it('renders real request and encrypted-response SVGs with a QR quiet zone', async () => {
    const fixture = await createSignedTrustedFixture();
    try {
      for (const packet of [fixture.request, fixture.response]) {
        const svg = await renderSignedTrustedQr(packet);
        const document = new DOMParser().parseFromString(svg, 'image/svg+xml');
        expect(document.documentElement.tagName).toBe('svg');
        expect(document.querySelector('parsererror')).toBeNull();
        expect(document.querySelectorAll('path').length).toBeGreaterThan(0);
        expect(svg).not.toContain('script');
      }
    } finally {
      fixture.vmk.fill(0);
    }
  });

  it('rejects a substituted transfer context before producing markup', async () => {
    const fixture = await createSignedTrustedFixture();
    try {
      await expect(
        renderSignedTrustedQr({
          ...fixture.request,
          transferRequest: {
            ...fixture.request.transferRequest,
            workspaceId: 'other',
          },
        }),
      ).rejects.toThrow();
    } finally {
      fixture.vmk.fill(0);
    }
  });
});
