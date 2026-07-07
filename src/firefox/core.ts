/**
 * Core WebDriver + BiDi connection management
 */

import { Builder, Browser, Capabilities, WebDriver } from 'selenium-webdriver';
import firefox from 'selenium-webdriver/firefox.js';
import { mkdirSync, openSync, closeSync, existsSync, readdirSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, delimiter } from 'node:path';
import type { FirefoxLaunchOptions } from './types.js';
import { log, logDebug } from '../utils/logger.js';
import { resolveProfilePath } from './profile.js';
import { BROWSER, defaultZenPath, detectZenMetadata } from '../config/browser.js';

// ---------------------------------------------------------------------------
// Geckodriver binary finder
// ---------------------------------------------------------------------------

function findGeckodriverInPath(binaryName: string): string | null {
  for (const dir of (process.env.PATH ?? '').split(delimiter)) {
    if (!dir) {
      continue;
    }
    const candidate = join(dir, binaryName);
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  return null;
}

function findGeckodriverInSeleniumCache(binaryName: string): string | null {
  const cacheBase = join(homedir(), '.cache/selenium/geckodriver');
  try {
    if (!existsSync(cacheBase)) {
      return null;
    }
    for (const platformDir of readdirSync(cacheBase)) {
      const platformPath = join(cacheBase, platformDir);
      if (!statSync(platformPath).isDirectory()) {
        continue;
      }
      for (const versionDir of readdirSync(platformPath).sort().reverse()) {
        const candidate = join(platformPath, versionDir, binaryName);
        if (existsSync(candidate)) {
          return candidate;
        }
      }
    }
  } catch {
    // ignore permission errors
  }
  return null;
}

async function findGeckodriverInNpmPackage(): Promise<string | null> {
  try {
    const { download } = await import('geckodriver');
    log('geckodriver not found in PATH or selenium cache, resolving from npm package...');
    return await download();
  } catch {
    return null;
  }
}

/**
 * Finds the geckodriver binary using three strategies in order:
 * 1. Search PATH directly (fast, no subprocess)
 * 2. Walk the selenium cache directory
 * 3. Download via the bundled geckodriver npm package
 * Throws if none succeeds.
 */
async function findGeckodriver(): Promise<string> {
  const ext = process.platform === 'win32' ? '.exe' : '';
  const binaryName = `geckodriver${ext}`;

  const found =
    findGeckodriverInPath(binaryName) ??
    findGeckodriverInSeleniumCache(binaryName) ??
    (await findGeckodriverInNpmPackage());

  if (!found) {
    throw new Error('Cannot find geckodriver binary. Ensure geckodriver is in PATH.');
  }
  return found;
}

export class FirefoxCore {
  private currentContextId: string | null = null;
  private driver: WebDriver | null = null;
  private zenVersion: string | null = null;
  private geckoVersion: string | null = null;
  private logFileFd: number | undefined;
  private logFilePath: string | undefined;
  private originalEnv: Record<string, string | undefined> = {};
  private profileWarning: string | null = null;

  constructor(private options: FirefoxLaunchOptions) {}

  /**
   * Launch Zen (or connect to an existing instance) and establish BiDi connection
   */
  async connect(): Promise<void> {
    if (this.options.connectExisting) {
      log('Connecting to existing Zen via Marionette...');
    } else {
      log('Launching Zen via Selenium WebDriver BiDi...');
    }

    if (this.options.connectExisting) {
      const port = this.options.marionettePort ?? 2828;

      const geckodriverPath = await findGeckodriver();
      logDebug(`Using geckodriver: ${geckodriverPath}`);

      // Build a geckodriver service that connects to the running Zen.
      // ServiceBuilder already knows about --connect-existing and skips --websocket-port.
      const serviceBuilder = new firefox.ServiceBuilder(geckodriverPath);
      serviceBuilder.addArguments('--connect-existing', `--marionette-port=${port}`);

      // Use minimal capabilities: only request webSocketUrl for BiDi.
      // Deliberately avoid firefox.Options() here: its constructor sets
      // moz:firefoxOptions.prefs.remote.active-protocols = 1, which geckodriver
      // may apply to the running browser via Marionette. Changing that preference
      // on a live Zen can disrupt the Remote Agent and leave the Marionette
      // session in a locked state that blocks reconnection.
      const caps = new Capabilities();
      caps.set('webSocketUrl', true);

      // createSession() returns synchronously; the session is established async under the hood.
      // Passing geckodriverPath to ServiceBuilder prevents getBinaryPaths() from running,
      // which would otherwise invoke selenium-manager with --browser firefox.
      this.driver = firefox.Driver.createSession(caps, serviceBuilder.build());
    } else {
      const zenPath = this.options.zenPath ?? defaultZenPath();
      if (!zenPath) {
        throw new Error(
          `Zen executable not found. Pass --zen-path or set ZEN_PATH. Expected macOS default: ${BROWSER.defaultMacOSBinary}`
        );
      }
      this.options.zenPath = zenPath;

      // Set up output file for capturing Zen stdout/stderr
      if (this.options.logFile) {
        this.logFilePath = this.options.logFile;
      } else if (this.options.env && Object.keys(this.options.env).length > 0) {
        const outputDir = join(homedir(), BROWSER.profileBaseDirName, 'output');
        mkdirSync(outputDir, { recursive: true });
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        this.logFilePath = join(outputDir, `${BROWSER.outputLogPrefix}-${timestamp}.log`);
      }

      // Set environment variables inherited by geckodriver and Zen.
      if (this.options.env) {
        for (const [key, value] of Object.entries(this.options.env)) {
          this.originalEnv[key] = process.env[key];
          process.env[key] = value;
          logDebug(`Set env ${key}=${value}`);
        }

        // Important: Do NOT set MOZ_LOG_FILE - MOZ_LOG writes to stderr by default
        // We capture stderr directly through file descriptor redirection
        if (this.options.env.MOZ_LOG_FILE) {
          logDebug('Note: MOZ_LOG_FILE in env will be used, but may be blocked by sandbox');
        }
      }

      // Standard path: launch a new Zen via selenium-webdriver's Firefox/geckodriver API.
      const firefoxOptions = new firefox.Options();
      firefoxOptions.enableBidi();

      if (this.options.headless) {
        firefoxOptions.addArguments('-headless');
      }
      if (this.options.viewport) {
        firefoxOptions.windowSize({
          width: this.options.viewport.width,
          height: this.options.viewport.height,
        });
      }
      firefoxOptions.setBinary(zenPath);
      if (this.options.args && this.options.args.length > 0) {
        firefoxOptions.addArguments(...this.options.args);
      }
      if (this.options.profilePath) {
        // Resolve to a dedicated MCP subfolder to avoid exposing a real user profile.
        // resolveProfilePath creates the directory on first use and warns when the
        // provided path already looks like a real Gecko profile.
        const { path: resolvedProfilePath, warning } = resolveProfilePath(this.options.profilePath);
        this.profileWarning = warning;
        // Use the native --profile argument for reliable profile loading
        // (Selenium's setProfile() copies to temp dir which can be unreliable)
        firefoxOptions.addArguments('--profile', resolvedProfilePath);
        log(`Using Zen profile: ${resolvedProfilePath}`);
      }
      if (this.options.acceptInsecureCerts) {
        firefoxOptions.setAcceptInsecureCerts(true);
      }
      if (this.options.prefs) {
        for (const [name, value] of Object.entries(this.options.prefs)) {
          firefoxOptions.setPreference(name, value);
        }
        if (
          this.options.prefs['remote.prefs.recommended'] === false &&
          !('app.update.disabledForTesting' in this.options.prefs)
        ) {
          firefoxOptions.setPreference('app.update.disabledForTesting', true);
        }
      }

      const geckodriverPath = await findGeckodriver();
      logDebug(`Using geckodriver: ${geckodriverPath}`);
      const serviceBuilder = new firefox.ServiceBuilder(geckodriverPath);

      if (this.logFilePath) {
        // Open file for appending, create if doesn't exist
        this.logFileFd = openSync(this.logFilePath, 'a');
        serviceBuilder.setStdio(['ignore', this.logFileFd, this.logFileFd]);
        log(`Capturing Zen output to: ${this.logFilePath}`);
      }

      const remoteLogLevel = this.options.prefs?.['remote.log.level'];
      if (remoteLogLevel && typeof remoteLogLevel === 'string') {
        serviceBuilder.addArguments('--log', remoteLogLevel.toLowerCase());
      }

      this.driver = await new Builder()
        .forBrowser(Browser.FIREFOX)
        .setFirefoxOptions(firefoxOptions)
        .setFirefoxService(serviceBuilder)
        .build();
    }

    log(this.options.connectExisting ? 'Connected to existing Zen' : 'Zen launched with BiDi');

    const driverCapabilities = await this.driver.getCapabilities();
    const capabilitiesVersion = (driverCapabilities.get('browserVersion') as string) ?? null;
    const metadata = detectZenMetadata(
      this.options.zenPath ?? defaultZenPath(),
      capabilitiesVersion
    );
    this.zenVersion = metadata.zenVersion;
    this.geckoVersion = metadata.geckoVersion;
    logDebug(`Zen version: ${this.zenVersion ?? '(unknown)'}`);
    logDebug(`Gecko version: ${this.geckoVersion ?? '(unknown)'}`);

    // Remember current window handle (browsing context)
    this.currentContextId = await this.driver.getWindowHandle();
    logDebug(`Browsing context ID: ${this.currentContextId}`);

    // Navigate if startUrl provided (skip for connectExisting to not disrupt the user's browsing)
    if (this.options.startUrl && !this.options.connectExisting) {
      await this.driver.get(this.options.startUrl);
      logDebug(`Navigated to: ${this.options.startUrl}`);
    }

    log('Zen DevTools ready');
  }

  /**
   * Get driver instance (throw if not connected)
   */
  getDriver(): WebDriver {
    if (!this.driver) {
      throw new Error('Driver not connected');
    }
    return this.driver;
  }

  /**
   * Check if Zen is still connected and responsive
   * Returns false if Zen was closed or connection is broken
   */
  async isConnected(): Promise<boolean> {
    if (!this.driver) {
      return false;
    }

    try {
      await this.driver.getWindowHandle();
      return true;
    } catch {
      logDebug('Connection check failed: Zen is not responsive');
      return false;
    }
  }

  /**
   * Get current browsing context ID
   */
  getCurrentContextId(): string | null {
    return this.currentContextId;
  }

  /**
   * Update current context ID (used by page management)
   */
  setCurrentContextId(contextId: string): void {
    this.currentContextId = contextId;
  }

  /**
   * Get the Gecko version used for protocol capability checks.
   */
  getFirefoxVersion(): string | null {
    return this.geckoVersion;
  }

  getZenVersion(): string | null {
    return this.zenVersion;
  }

  getGeckoVersion(): string | null {
    return this.geckoVersion;
  }

  /**
   * Get log file path
   */
  getLogFilePath(): string | undefined {
    return this.logFilePath;
  }

  /**
   * Get and clear the profile warning generated during connect() (if any).
   * Consumed once by the first tool response so the MCP client surfaces it to the user.
   */
  getAndClearProfileWarning(): string | null {
    const warning = this.profileWarning;
    this.profileWarning = null;
    return warning;
  }

  /**
   * Get current launch options
   */
  getOptions(): FirefoxLaunchOptions {
    return this.options;
  }

  /**
   * Wait for WebSocket to be in OPEN state
   */
  private async waitForWebSocketOpen(ws: any, timeout: number = 5000): Promise<void> {
    // Already open
    if (ws.readyState === 1) {
      return;
    }

    // Still connecting - wait for open event with timeout
    if (ws.readyState === 0) {
      return new Promise<void>((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          ws.off('open', onOpen);
          reject(new Error('Timeout waiting for WebSocket to open'));
        }, timeout);

        const onOpen = () => {
          clearTimeout(timeoutId);
          ws.off('open', onOpen);
          resolve();
        };
        ws.on('open', onOpen);
      });
    }

    throw new Error(`WebSocket is not open: readyState ${ws.readyState}`);
  }

  /**
   * Send raw BiDi command and get response
   */
  async sendBiDiCommand(method: string, params: Record<string, any> = {}): Promise<any> {
    if (!this.driver) {
      throw new Error('Driver not connected');
    }

    const bidi = await this.driver.getBidi();
    // bidi.socket is a Node.js `ws` WebSocket (EventEmitter-style), but typed as browser WebSocket
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ws = bidi.socket as any;

    // Wait for WebSocket to be ready before sending
    await this.waitForWebSocketOpen(ws);

    const id = Math.floor(Math.random() * 1000000);

    return new Promise((resolve, reject) => {
      const messageHandler = (data: any) => {
        try {
          const payload = JSON.parse(data.toString());
          if (payload.id === id) {
            ws.off('message', messageHandler);
            if (payload.error) {
              reject(new Error(`BiDi error: ${JSON.stringify(payload.error)}`));
            } else {
              resolve(payload.result);
            }
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.on('message', messageHandler);

      const command = {
        id,
        method,
        params,
      };

      ws.send(JSON.stringify(command));

      setTimeout(() => {
        ws.off('message', messageHandler);
        reject(new Error(`BiDi command timeout: ${method}`));
      }, 10000);
    });
  }

  /**
   * Close driver and cleanup.
   * - Tries graceful quit() with a timeout; on timeout, force-kills via onQuit_().
   * - Restores env vars, closes log fd, clears all state.
   * - Never throws — callers can rely on cleanup completing.
   */
  async close(): Promise<void> {
    if (!this.driver) {
      return;
    }

    const webdriver = this.driver as any; // Selenium WebDriver
    const webdriverQuitTimeout = 5000;

    // Null to prevent re-entrancy
    this.driver = null;
    this.currentContextId = null;
    this.logFilePath = undefined;
    this.profileWarning = null;

    // Selenium's quit() skips closing the BiDi WebSocket when onQuit_ is set.
    // We must close it first: geckodriver may not release the Marionette session
    // until the BiDi connection is cleanly terminated.
    if (webdriver._bidiConnection) {
      try {
        webdriver._bidiConnection.close();
      } catch {
        /* already dead */
      } finally {
        webdriver._bidiConnection = undefined;
      }
    }

    // In connect-existing mode, geckodriver's DELETE /session releases Marionette
    // without terminating Zen (since geckodriver was started with --connect-existing).
    if ('quit' in webdriver) {
      let timer: NodeJS.Timeout;
      try {
        // Give webdriver.quit() a certain timeout
        await Promise.race([
          (webdriver as { quit(): Promise<void> }).quit(),
          new Promise<never>((_, reject) => {
            timer = setTimeout(() => reject(new Error('close timeout')), webdriverQuitTimeout);
          }),
        ]);
      } catch {
        const webdriverHasOnQuit = typeof webdriver.onQuit_ === 'function';
        logDebug('WebDriver.quit() timed out or failed - force killing geckodriver');
        if (webdriverHasOnQuit) {
          void webdriver.onQuit_().catch(() => {});
        }
      } finally {
        clearTimeout(timer!);
      }
    }

    // Close log file descriptor if open
    if (this.logFileFd !== undefined) {
      try {
        closeSync(this.logFileFd);
        logDebug('Log file closed');
      } catch (error) {
        logDebug(
          `Error closing log file: ${error instanceof Error ? error.message : String(error)}`
        );
      }
      this.logFileFd = undefined;
    }

    // Restore original environment variables
    for (const [key, value] of Object.entries(this.originalEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
    this.originalEnv = {};

    log('Zen DevTools closed');
  }
}
