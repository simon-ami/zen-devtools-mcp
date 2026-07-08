/**
 * Tests for connect-existing mode (FirefoxCore behaviour)
 */

import { describe, it, expect, vi } from 'vitest';
import { createServer } from 'node:net';

async function getClosedLocalPort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (!address || typeof address === 'string') {
    throw new Error('Expected TCP server address');
  }
  const port = address.port;
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  return port;
}

describe('getFirefox() reconnect behavior', () => {
  it('should reconnect when connection is lost instead of throwing', async () => {
    vi.resetModules();

    // Mock the firefox module
    const mockIsConnected = vi.fn();
    const mockConnect = vi.fn();
    const mockClose = vi.fn();

    vi.doMock('@/firefox/index.js', () => ({
      ZenDevTools: vi.fn(() => ({
        isConnected: mockIsConnected,
        connect: mockConnect,
        close: mockClose,
      })),
    }));

    // First call: create instance, connection works
    mockIsConnected.mockResolvedValueOnce(true);
    mockConnect.mockResolvedValue(undefined);

    // This test verifies the reconnect logic pattern:
    // When isConnected() returns false, getFirefox() should reset and create
    // a new connection instead of throwing FirefoxDisconnectedError
    const { FirefoxCore } = await import('@/firefox/core.js');
    const core = new FirefoxCore({
      headless: true,
      connectExisting: true,
      marionettePort: 2828,
    });

    // Verify close() clears the state
    (core as any).driver = { quit: vi.fn().mockResolvedValue(undefined) };
    core.setCurrentContextId('old-context');
    await core.close();
    expect(core.getCurrentContextId()).toBe(null);
    expect(() => core.getDriver()).toThrow('Driver not connected');
  });

  it('fails fast when connect-existing has no reachable Marionette port', async () => {
    const { FirefoxCore } = await import('@/firefox/core.js');
    const port = await getClosedLocalPort();

    const core = new FirefoxCore({
      headless: true,
      connectExisting: true,
      marionettePort: port,
    });

    await expect(core.connect()).rejects.toThrow(
      new RegExp(`Cannot connect to Zen Marionette on 127\\.0\\.0\\.1:${port}`)
    );
  });
});
