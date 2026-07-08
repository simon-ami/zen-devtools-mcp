// Vitest setup file
// This file runs before all tests

import { beforeAll, afterAll } from 'vitest';
import { execSync } from 'child_process';

// Track if we're in cleanup mode
let isCleaningUp = false;

beforeAll(() => {
  // Setup code runs before all tests
});

afterAll(() => {
  // Global cleanup: kill any remaining Zen/geckodriver processes
  cleanup();
});

/**
 * Cleanup function to kill all Zen and geckodriver processes
 * This ensures no zombie processes are left after test runs
 */
function cleanup() {
  if (isCleaningUp) {
    return; // Prevent recursive cleanup
  }
  isCleaningUp = true;

  try {
    // Find Zen processes started with --marionette (test instances)
    const zenPids = execSync('pgrep -f "zen.*marionette" || true', {
      encoding: 'utf-8',
    })
      .trim()
      .split('\n')
      .filter(Boolean);

    // Kill children of each Zen test process, then kill the parent
    for (const pid of zenPids) {
      try {
        execSync(`pkill -9 -P ${pid} 2>/dev/null || true`, { stdio: 'ignore' });
      } catch {
        // Ignore errors - child processes might already be dead
      }
      try {
        execSync(`kill -9 ${pid} 2>/dev/null || true`, { stdio: 'ignore' });
      } catch {
        // Ignore errors - process might already be dead
      }
    }

    // Kill all geckodriver processes
    execSync('pkill -9 -f geckodriver || true', {
      stdio: 'ignore',
    });

    console.log(' Global cleanup: All test Zen processes terminated');
  } catch (error) {
    // Ignore errors - processes might already be dead
  } finally {
    isCleaningUp = false;
  }
}

// Handle process termination signals
process.on('SIGINT', () => {
  console.log('\n SIGINT received, cleaning up Zen processes...');
  cleanup();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n SIGTERM received, cleaning up Zen processes...');
  cleanup();
  process.exit(0);
});

// Handle unhandled errors
process.on('uncaughtException', (error) => {
  console.error(' Uncaught exception:', error);
  cleanup();
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error(' Unhandled rejection:', reason);
  cleanup();
  process.exit(1);
});
