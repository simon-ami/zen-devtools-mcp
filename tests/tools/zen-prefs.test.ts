import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  setZenPrefsTool,
  getZenPrefsTool,
  handleSetZenPrefs,
  handleGetZenPrefs,
} from '../../src/tools/zen-prefs.js';

const mockGetFirefox = vi.hoisted(() => vi.fn());

vi.mock('../../src/index.js', () => ({
  getFirefox: () => mockGetFirefox(),
}));

describe('Zen Prefs Tool Definitions', () => {
  describe('setZenPrefsTool', () => {
    it('has the Zen tool name and prefs schema', () => {
      const schema = setZenPrefsTool.inputSchema as {
        required?: string[];
        properties?: Record<string, { type: string }>;
      };
      expect(setZenPrefsTool.name).toBe('set_zen_prefs');
      expect(schema.required).toContain('prefs');
      expect(schema.properties?.prefs?.type).toBe('object');
    });
  });

  describe('getZenPrefsTool', () => {
    it('has the Zen tool name and names schema', () => {
      const schema = getZenPrefsTool.inputSchema as {
        required?: string[];
        properties?: Record<string, { type: string }>;
      };
      expect(getZenPrefsTool.name).toBe('get_zen_prefs');
      expect(schema.required).toContain('names');
      expect(schema.properties?.names?.type).toBe('array');
    });
  });
});

describe('Zen Prefs Tool Handlers', () => {
  const mockExecuteScript = vi.fn();
  const mockSetContext = vi.fn();
  const mockSwitchToWindow = vi.fn();
  const mockSendBiDiCommand = vi.fn();

  let originalEnv: string | undefined;

  beforeEach(() => {
    vi.clearAllMocks();
    originalEnv = process.env.MOZ_REMOTE_ALLOW_SYSTEM_ACCESS;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.MOZ_REMOTE_ALLOW_SYSTEM_ACCESS = originalEnv;
    } else {
      delete process.env.MOZ_REMOTE_ALLOW_SYSTEM_ACCESS;
    }
  });

  function mockZenWithPrivilegedContext() {
    mockSendBiDiCommand.mockResolvedValue({
      contexts: [{ context: 'chrome-context-id' }],
    });

    mockGetFirefox.mockResolvedValue({
      sendBiDiCommand: mockSendBiDiCommand,
      getDriver: vi.fn().mockReturnValue({
        switchTo: () => ({ window: mockSwitchToWindow }),
        setContext: mockSetContext,
        executeScript: mockExecuteScript,
      }),
      getCurrentContextId: vi.fn().mockReturnValue('content-context-id'),
    });
  }

  describe('handleSetZenPrefs', () => {
    it('returns error when prefs parameter is missing', async () => {
      const result = await handleSetZenPrefs({});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('prefs parameter is required');
    });

    it('returns success when prefs is empty', async () => {
      const result = await handleSetZenPrefs({ prefs: {} });

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain('No preferences to set');
    });

    it('returns helpful error when no privileged contexts are available', async () => {
      mockSendBiDiCommand.mockResolvedValue({ contexts: [] });
      mockGetFirefox.mockResolvedValue({
        sendBiDiCommand: mockSendBiDiCommand,
        getDriver: vi.fn(),
        getCurrentContextId: vi.fn(),
      });

      const result = await handleSetZenPrefs({ prefs: { 'test.pref': 'value' } });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('MOZ_REMOTE_ALLOW_SYSTEM_ACCESS');
    });

    it('sets preferences successfully', async () => {
      mockZenWithPrivilegedContext();

      const result = await handleSetZenPrefs({
        prefs: { 'test.bool': true, 'test.int': 42, 'test.string': 'hello' },
      });

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain('Set 3 preference(s)');
      expect(mockExecuteScript).toHaveBeenCalledTimes(3);
      expect(mockExecuteScript).toHaveBeenCalledWith(
        'Services.prefs.setBoolPref("test.bool", true)'
      );
      expect(mockExecuteScript).toHaveBeenCalledWith('Services.prefs.setIntPref("test.int", 42)');
      expect(mockExecuteScript).toHaveBeenCalledWith(
        'Services.prefs.setStringPref("test.string", "hello")'
      );
    });

    it('handles partial failures without aborting successful prefs', async () => {
      mockZenWithPrivilegedContext();
      mockExecuteScript
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Pref error'));

      const result = await handleSetZenPrefs({
        prefs: { 'good.pref': 'value', 'bad.pref': 'value' },
      });

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain('Set 1 preference(s)');
      expect(result.content[0].text).toContain('Failed to set 1 preference(s)');
    });
  });

  describe('handleGetZenPrefs', () => {
    it('returns error when names parameter is missing or empty', async () => {
      const missing = await handleGetZenPrefs({});
      const empty = await handleGetZenPrefs({ names: [] });

      expect(missing.isError).toBe(true);
      expect(empty.isError).toBe(true);
      expect(missing.content[0].text).toContain('names parameter is required');
      expect(empty.content[0].text).toContain('names parameter is required');
    });

    it('gets preferences successfully', async () => {
      mockZenWithPrivilegedContext();
      mockExecuteScript.mockResolvedValue({ exists: true, value: 'test-value' });

      const result = await handleGetZenPrefs({ names: ['test.pref'] });

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain('Zen Preferences');
      expect(result.content[0].text).toContain('test.pref');
      expect(result.content[0].text).toContain('"test-value"');
    });

    it('handles non-existent preferences', async () => {
      mockZenWithPrivilegedContext();
      mockExecuteScript.mockResolvedValue({ exists: false });

      const result = await handleGetZenPrefs({ names: ['nonexistent.pref'] });

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain('(not set)');
    });

    it('returns error when no privileged contexts are available', async () => {
      mockSendBiDiCommand.mockResolvedValue({ contexts: [] });
      mockGetFirefox.mockResolvedValue({
        sendBiDiCommand: mockSendBiDiCommand,
        getDriver: vi.fn(),
        getCurrentContextId: vi.fn(),
      });

      const result = await handleGetZenPrefs({ names: ['test.pref'] });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('No privileged contexts');
    });
  });
});
