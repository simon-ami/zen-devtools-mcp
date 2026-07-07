import { describe, it, expect, vi, beforeEach } from 'vitest';
import { restartZenTool } from '../../src/tools/zen-management.js';

const mockSetNextLaunchOptions = vi.hoisted(() => vi.fn());
const mockResetFirefox = vi.hoisted(() => vi.fn());
const mockGetFirefoxIfRunning = vi.hoisted(() => vi.fn());
const mockArgs = vi.hoisted(() => ({
  zenPath: undefined as string | undefined,
  profilePath: undefined as string | undefined,
}));

const mockGetFirefox = vi.hoisted(() => vi.fn());

vi.mock('../../src/index.js', () => ({
  args: mockArgs,
  getFirefoxIfRunning: () => mockGetFirefoxIfRunning(),
  setNextLaunchOptions: (opts: unknown) => mockSetNextLaunchOptions(opts),
  resetFirefox: () => mockResetFirefox(),
  getFirefox: () => mockGetFirefox(),
}));

describe('Zen Management Tools', () => {
  describe('restartZenTool schema', () => {
    it('has zenPath, profilePath, and prefs in input schema properties', () => {
      const { properties } = restartZenTool.inputSchema as {
        properties: Record<string, { type: string; description: string }>;
      };
      expect(properties.zenPath.type).toBe('string');
      expect(properties.profilePath.type).toBe('string');
      expect(properties.prefs.type).toBe('object');
    });
  });

  describe('handleRestartZen', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      mockArgs.zenPath = undefined;
      mockArgs.profilePath = undefined;
    });

    describe('when Zen is not running', () => {
      beforeEach(() => {
        mockGetFirefoxIfRunning.mockReturnValue(null);
        mockArgs.zenPath = '/Applications/Zen.app/Contents/MacOS/zen';
      });

      it('uses provided profilePath in launch options', async () => {
        const { handleRestartZen } = await import('../../src/tools/zen-management.js');

        await handleRestartZen({ profilePath: '/custom/profile' });

        expect(mockSetNextLaunchOptions).toHaveBeenCalledWith(
          expect.objectContaining({
            profilePath: '/custom/profile',
          })
        );
      });

      it('falls back to args.profilePath when profilePath is not specified', async () => {
        mockArgs.profilePath = '/cli/profile';
        const { handleRestartZen } = await import('../../src/tools/zen-management.js');

        await handleRestartZen({});

        expect(mockSetNextLaunchOptions).toHaveBeenCalledWith(
          expect.objectContaining({
            zenPath: '/Applications/Zen.app/Contents/MacOS/zen',
            profilePath: '/cli/profile',
          })
        );
      });

      it('uses provided profilePath over args.profilePath', async () => {
        mockArgs.profilePath = '/cli/profile';
        const { handleRestartZen } = await import('../../src/tools/zen-management.js');

        await handleRestartZen({ profilePath: '/override/profile' });

        expect(mockSetNextLaunchOptions).toHaveBeenCalledWith(
          expect.objectContaining({
            profilePath: '/override/profile',
          })
        );
      });
    });

    describe('when Zen is running', () => {
      const mockZenInstance = {
        getOptions: vi.fn(),
        isConnected: vi.fn(),
      };

      beforeEach(() => {
        mockGetFirefoxIfRunning.mockReturnValue(mockZenInstance);
        mockZenInstance.isConnected.mockResolvedValue(true);
        mockZenInstance.getOptions.mockReturnValue({
          zenPath: '/current/zen',
          profilePath: '/current/profile',
          headless: false,
          env: {},
        });
      });

      it('preserves current profilePath when not specified', async () => {
        const { handleRestartZen } = await import('../../src/tools/zen-management.js');

        await handleRestartZen({});

        expect(mockSetNextLaunchOptions).toHaveBeenCalledWith(
          expect.objectContaining({
            profilePath: '/current/profile',
          })
        );
      });

      it('uses provided zenPath when specified', async () => {
        const { handleRestartZen } = await import('../../src/tools/zen-management.js');

        await handleRestartZen({ zenPath: '/new/zen' });

        expect(mockSetNextLaunchOptions).toHaveBeenCalledWith(
          expect.objectContaining({
            zenPath: '/new/zen',
          })
        );
      });

      it('merges prefs into launch options', async () => {
        mockZenInstance.getOptions.mockReturnValue({
          zenPath: '/current/zen',
          profilePath: '/current/profile',
          headless: false,
          env: {},
          prefs: { 'existing.pref': 'old' },
        });

        const { handleRestartZen } = await import('../../src/tools/zen-management.js');

        await handleRestartZen({
          prefs: { 'new.pref': 'value', 'existing.pref': 'new' },
        });

        expect(mockSetNextLaunchOptions).toHaveBeenCalledWith(
          expect.objectContaining({
            prefs: { 'existing.pref': 'new', 'new.pref': 'value' },
          })
        );
      });
    });
  });

  describe('handleGetZenInfo', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('includes Zen and Gecko versions and prefs in output', async () => {
      mockGetFirefox.mockResolvedValue({
        getOptions: vi.fn().mockReturnValue({
          zenPath: '/path/to/zen',
          headless: true,
          prefs: {
            'bool.pref': true,
            'int.pref': 42,
            'string.pref': 'hello',
          },
        }),
        getLogFilePath: vi.fn().mockReturnValue(undefined),
        getZenVersion: vi.fn().mockReturnValue('1.21.5b'),
        getGeckoVersion: vi.fn().mockReturnValue('152.0.4'),
      });

      const { handleGetZenInfo } = await import('../../src/tools/zen-management.js');

      const result = await handleGetZenInfo({});

      const text = result.content[0].text;
      expect(text).toContain('Zen version: 1.21.5b');
      expect(text).toContain('Gecko version: 152.0.4');
      expect(text).toContain('Preferences:');
      expect(text).toContain('bool.pref = true');
      expect(text).toContain('int.pref = 42');
      expect(text).toContain('string.pref = "hello"');
    });
  });
});
