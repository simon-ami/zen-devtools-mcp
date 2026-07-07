import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';

export const BROWSER = {
  displayName: 'Zen',
  serverName: 'zen-devtools',
  packageName: 'zen-devtools-mcp',
  debugNamespace: 'zen-devtools',
  profileBaseDirName: '.zen-devtools-mcp',
  mcpProfileDirName: 'zen_devtools_mcp_profile',
  outputLogPrefix: 'zen',
  defaultMacOSBinary: '/Applications/Zen.app/Contents/MacOS/zen',
} as const;

export interface BrowserMetadata {
  zenVersion: string | null;
  geckoVersion: string | null;
}

export function defaultZenPath(): string | undefined {
  if (process.platform !== 'darwin') {
    return undefined;
  }

  const candidates = [
    BROWSER.defaultMacOSBinary,
    join(homedir(), 'Applications/Zen.app/Contents/MacOS/zen'),
  ];

  return candidates.find((candidate) => existsSync(candidate));
}

export function profileBaseDir(): string {
  return join(homedir(), BROWSER.profileBaseDirName);
}

function readIniValue(filePath: string, section: string, key: string): string | null {
  try {
    const lines = readFileSync(filePath, 'utf8').split(/\r?\n/);
    let currentSection = '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('#')) {
        continue;
      }
      const sectionMatch = /^\[(.+)]$/.exec(trimmed);
      if (sectionMatch) {
        currentSection = sectionMatch[1] ?? '';
        continue;
      }
      if (currentSection !== section) {
        continue;
      }
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) {
        continue;
      }
      const name = trimmed.slice(0, eqIndex).trim();
      if (name === key) {
        return trimmed.slice(eqIndex + 1).trim();
      }
    }
  } catch {
    return null;
  }

  return null;
}

function resourceDirCandidates(zenPath: string | undefined): string[] {
  if (!zenPath) {
    return [];
  }

  const absolutePath = resolve(zenPath);
  if (absolutePath.endsWith('.app')) {
    return [join(absolutePath, 'Contents/Resources')];
  }

  const binaryDir = dirname(absolutePath);
  return [join(binaryDir, '../Resources'), binaryDir, join(binaryDir, 'browser')];
}

export function detectZenMetadata(
  zenPath: string | undefined,
  capabilitiesVersion: string | null = null
): BrowserMetadata {
  let zenVersion: string | null = null;
  let geckoVersion: string | null = null;

  for (const resourceDir of resourceDirCandidates(zenPath)) {
    const applicationIni = join(resourceDir, 'application.ini');
    const platformIni = join(resourceDir, 'platform.ini');

    zenVersion ??= readIniValue(applicationIni, 'App', 'Version');
    geckoVersion ??= readIniValue(platformIni, 'Build', 'Milestone');
    geckoVersion ??= readIniValue(applicationIni, 'Gecko', 'MaxVersion');

    if (zenVersion && geckoVersion) {
      break;
    }
  }

  return {
    zenVersion: zenVersion ?? capabilitiesVersion,
    geckoVersion: geckoVersion ?? capabilitiesVersion,
  };
}
