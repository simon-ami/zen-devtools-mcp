/**
 * CLI argument parsing for Zen DevTools MCP server
 */

import { createHash } from 'node:crypto';
import { join } from 'node:path';
import type { Options as YargsOptions } from 'yargs';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { BROWSER, profileBaseDir } from './config/browser.js';

/**
 * Parsed preference value (boolean, integer, or string)
 */
export type PrefValue = string | number | boolean;

/**
 * Returns the default profile parent directory for --auto-profile mode.
 * When a Zen binary path is given, a short hash of that path is appended
 * so that different builds (Release, Nightly, …) each get their own profile.
 */
export function defaultProfileDir(zenPath?: string): string {
  const base = profileBaseDir();
  if (!zenPath) {
    return join(base, 'profile');
  }
  const hash = createHash('sha1').update(zenPath).digest('hex').slice(0, 8);
  return join(base, `profile-${hash}`);
}

/**
 * Parse preference strings into typed values
 * Format: "name=value" where value is auto-typed as boolean/integer/string
 */
export function parsePrefs(prefs: string[] | undefined): Record<string, PrefValue> {
  const result: Record<string, PrefValue> = {};

  if (!prefs || prefs.length === 0) {
    return result;
  }

  for (const pref of prefs) {
    const eqIndex = pref.indexOf('=');
    if (eqIndex === -1) {
      // Skip malformed entries (no equals sign)
      continue;
    }

    const name = pref.slice(0, eqIndex);
    const rawValue = pref.slice(eqIndex + 1);

    // Type inference
    let value: PrefValue;
    if (rawValue === 'true') {
      value = true;
    } else if (rawValue === 'false') {
      value = false;
    } else if (/^-?\d+$/.test(rawValue)) {
      value = parseInt(rawValue, 10);
    } else {
      value = rawValue;
    }

    result[name] = value;
  }

  return result;
}

export const cliOptions = {
  zenPath: {
    type: 'string',
    description:
      'Path to Zen executable. Defaults to /Applications/Zen.app/Contents/MacOS/zen on macOS when present.',
    alias: 'z',
    default: process.env.ZEN_PATH || undefined,
  },
  headless: {
    type: 'boolean',
    description: 'Whether to run Zen in headless (no UI) mode',
    default: (process.env.ZEN_HEADLESS ?? 'false') === 'true',
  },
  viewport: {
    type: 'string',
    description:
      'Initial viewport size for Zen instances. For example, `1280x720`. In headless mode, max size is 3840x2160px.',
    coerce: (arg: string | undefined) => {
      if (arg === undefined) {
        return;
      }
      const [width, height] = arg.split('x').map(Number);
      if (!width || !height || Number.isNaN(width) || Number.isNaN(height)) {
        throw new Error('Invalid viewport. Expected format is `1280x720`.');
      }
      return {
        width,
        height,
      };
    },
  },
  acceptInsecureCerts: {
    type: 'boolean',
    description:
      'If enabled, ignores errors relative to self-signed and expired certificates. Use with caution.',
    default: (process.env.ACCEPT_INSECURE_CERTS ?? 'false') === 'true',
  },
  profilePath: {
    type: 'string',
    description:
      'Path to Zen profile parent directory. The server creates a safe MCP subprofile in it.',
  },
  autoProfile: {
    type: 'boolean',
    description:
      `Automatically use a persistent profile stored in ~/${BROWSER.profileBaseDirName}/. ` +
      'When --zen-path is set, the profile is scoped to that binary so different ' +
      'Zen builds stay isolated.',
    default: (process.env.AUTO_PROFILE ?? 'true') !== 'false',
  },
  zenArg: {
    type: 'array',
    description:
      'Additional arguments for Zen. Use --zen-arg=--flag for values that start with --.',
  },
  startUrl: {
    type: 'string',
    description: 'URL to open when Zen starts (default: about:blank)',
    default: process.env.START_URL ?? 'about:blank',
  },
  connectExisting: {
    type: 'boolean',
    description:
      'Connect to an already-running Zen instance via Marionette instead of launching a new one. Requires Zen to be running with marionette.enabled=true or launched with --marionette.',
    default: (process.env.CONNECT_EXISTING ?? 'false') === 'true',
  },
  marionettePort: {
    type: 'number',
    description: 'Marionette port to connect to when using --connect-existing (default: 2828)',
    default: Number(process.env.MARIONETTE_PORT ?? '2828'),
  },
  env: {
    type: 'array',
    description:
      'Environment variables for Zen in KEY=VALUE format. Can be specified multiple times. Example: --env MOZ_LOG=HTMLMediaElement:4',
  },
  outputFile: {
    type: 'string',
    description: `Path to file where Zen output (stdout/stderr) will be written. If not specified, output is written to ~/${BROWSER.profileBaseDirName}/output/`,
  },
  pref: {
    type: 'array',
    string: true,
    description:
      'Set Zen preference at startup via moz:firefoxOptions (format: name=value). Can be specified multiple times.',
    alias: 'p',
  },
  logFile: {
    type: 'string',
    description:
      'Path to a file where MCP server logs will be written. Set DEBUG=* to also enable verbose debug logs.',
  },
  enableScript: {
    type: 'boolean',
    description:
      'Enable the script tools such as script evaluation and logpoints (Gecko 153+ required).',
    default: (process.env.ENABLE_SCRIPT ?? 'false') === 'true',
  },
  enablePrivilegedContext: {
    type: 'boolean',
    description:
      'Enable privileged context tools: list/select privileged contexts, evaluate privileged scripts, get/set Zen prefs, and list extensions. Requires MOZ_REMOTE_ALLOW_SYSTEM_ACCESS=1.',
    default: (process.env.ENABLE_PRIVILEGED_CONTEXT ?? 'false') === 'true',
  },
} satisfies Record<string, YargsOptions>;

export function parseArguments(version: string, argv = process.argv, includePrivileged = true) {
  const { enablePrivilegedContext: _, ...rest } = cliOptions;
  const options = includePrivileged ? cliOptions : rest;
  const yargsInstance = yargs(hideBin(argv))
    .scriptName(`npx ${BROWSER.packageName}`)
    .options(options)
    .example([
      ['$0 --zen-path /Applications/Zen.app/Contents/MacOS/zen', 'Use a specific Zen executable'],
      ['$0 --headless', 'Run Zen in headless mode'],
      ['$0 --viewport 1280x720', 'Launch Zen with viewport size of 1280x720px'],
      ['$0 --help', 'Print CLI options'],
    ]);

  return yargsInstance
    .wrap(Math.min(120, yargsInstance.terminalWidth()))
    .help()
    .version(version)
    .parseSync();
}
