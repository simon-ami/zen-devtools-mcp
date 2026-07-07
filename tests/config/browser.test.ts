import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { BROWSER, detectZenMetadata, profileBaseDir } from '../../src/config/browser.js';

describe('browser config', () => {
  it('defines Zen public identity values', () => {
    expect(BROWSER.serverName).toBe('zen-devtools');
    expect(BROWSER.packageName).toBe('zen-devtools-mcp');
    expect(BROWSER.mcpProfileDirName).toBe('zen_devtools_mcp_profile');
    expect(profileBaseDir()).toContain('.zen-devtools-mcp');
  });

  it('reads Zen and Gecko versions from app resources', () => {
    const root = mkdtempSync(join(tmpdir(), 'zen-metadata-'));
    try {
      const macOSDir = join(root, 'Zen.app', 'Contents', 'MacOS');
      const resourcesDir = join(root, 'Zen.app', 'Contents', 'Resources');
      mkdirSync(macOSDir, { recursive: true });
      mkdirSync(resourcesDir, { recursive: true });
      const zenPath = join(macOSDir, 'zen');

      writeFileSync(
        join(resourcesDir, 'application.ini'),
        '[App]\nName=Zen\nVersion=1.21.5b\n\n[Gecko]\nMaxVersion=152.0.4\n'
      );
      writeFileSync(join(resourcesDir, 'platform.ini'), '[Build]\nMilestone=152.0.4\n');

      expect(detectZenMetadata(zenPath)).toEqual({
        zenVersion: '1.21.5b',
        geckoVersion: '152.0.4',
      });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
