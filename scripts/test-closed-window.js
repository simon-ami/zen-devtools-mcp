#!/usr/bin/env node
/**
 * Test: zombie geckodriver cleanup
 *
 * Scenario B (SIGKILL): Zen is completely dead (user clicked [X]).
 *   Recovery test: can close() clean up and reconnect after Zen dies?
 *
 * Scenario C (SIGKILL, non-headless): Same as B with a visible browser window.
 */
import { ZenDevTools } from '../dist/index.js';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parsePids(output) {
  return output
    .trim()
    .split('\n')
    .map(Number)
    .filter((n) => !isNaN(n));
}

function pgrep(pattern) {
  try {
    return parsePids(execFileSync('pgrep', ['-f', pattern], { encoding: 'utf-8' }));
  } catch {
    return [];
  }
}

function getProcState(pid) {
  try {
    const stat = readFileSync(`/proc/${pid}/stat`, 'utf-8');
    return stat[stat.lastIndexOf(')') + 2];
  } catch {
    return null;
  }
}

function isAlive(pid) {
  const state = getProcState(pid);
  return state !== null && state !== 'Z';
}

function killHard(pid) {
  try {
    process.kill(pid, 'SIGKILL');
  } catch {}
}

function getDescendants(parentPid) {
  const result = [];
  const queue = [parentPid];
  while (queue.length > 0) {
    const pid = queue.shift();
    try {
      const children = parsePids(execFileSync('pgrep', ['-P', String(pid)], { encoding: 'utf-8' }));
      result.push(...children);
      queue.push(...children);
    } catch {}
  }
  return result;
}

function waitForDeath(pid, timeoutMs) {
  return new Promise((resolve) => {
    const start = Date.now();
    const check = () => {
      if (!isAlive(pid)) resolve(true);
      else if (Date.now() - start > timeoutMs) resolve(false);
      else setTimeout(check, 100);
    };
    check();
  });
}

function killAll(pids) {
  for (const pid of pids) killHard(pid);
}

async function reconnect(geckosBefore, excludePids) {
  const r = await launchZen(geckosBefore, excludePids);
  await r.devTools.navigate('about:blank');
  console.log('     Navigation works');
  await r.devTools.close();
  return r.geckoPid;
}

// Log unhandled rejections instead of swallowing them silently
process.on('unhandledRejection', (reason) => {
  console.error('[unhandled rejection]', reason);
});

// ---------------------------------------------------------------------------
// Launch helper
// ---------------------------------------------------------------------------

async function launchZen(geckosBefore, excludePids = [], headless = true) {
  const devTools = new ZenDevTools({
    headless,
    viewport: { width: 1280, height: 720 },
  });
  await devTools.connect();

  const geckoPid = pgrep('geckodriver').find(
    (p) => !geckosBefore.has(p) && !excludePids.includes(p)
  );
  if (!geckoPid) throw new Error('No geckodriver PID found after connect');

  const zenPids = getDescendants(geckoPid);
  if (zenPids.length === 0) {
    killHard(geckoPid);
    throw new Error('No Zen PIDs found under geckodriver');
  }

  return { devTools, geckoPid, zenPids };
}

// ---------------------------------------------------------------------------
// Test
// ---------------------------------------------------------------------------

async function main() {
  console.log('--- Zombie geckodriver fix test ---\n');
  const geckosBefore = new Set(pgrep('geckodriver'));
  const usedPids = [];

  console.log('Scenario B: Zen killed (SIGKILL)');

  console.log('  1. Launching Zen...');
  const b = await launchZen(geckosBefore, usedPids);
  console.log(`     Geckodriver PID: ${b.geckoPid}, Zen PIDs: ${b.zenPids.join(', ')}`);

  console.log('  2. Killing Zen...');
  killAll(b.zenPids);
  for (const pid of b.zenPids) {
    if (!(await waitForDeath(pid, 5000))) {
      console.error(`  [FATAL] Zen PID ${pid} survived SIGKILL`);
      killHard(b.geckoPid);
      process.exit(1);
    }
  }
  console.log('     Zen is dead');

  console.log(
    `  3. ${isAlive(b.geckoPid) ? 'Zombie geckodriver detected' : 'Geckodriver died with Zen (no zombie)'}`
  );

  console.log('  4. Running cleanup (close() handles timeout + force-kill)...');
  await b.devTools.close();

  console.log('  5. Verifying geckodriver is dead...');
  if (!(await waitForDeath(b.geckoPid, 5000))) {
    console.error('  [FAIL] Geckodriver still alive after cleanup');
    killHard(b.geckoPid);
    process.exit(1);
  }
  console.log('     Geckodriver is dead');

  console.log('  6. Reconnecting...');
  usedPids.push(b.geckoPid);
  usedPids.push(await reconnect(geckosBefore, usedPids));
  console.log('  Scenario B: PASS\n');

  console.log('Scenario C: Zen killed (SIGKILL) — non-headless');

  console.log('  1. Launching Zen (non-headless)...');
  const c = await launchZen(geckosBefore, usedPids, false);
  console.log(`     Geckodriver PID: ${c.geckoPid}, Zen PIDs: ${c.zenPids.join(', ')}`);

  console.log('  2. Killing Zen...');
  killAll(c.zenPids);
  for (const pid of c.zenPids) {
    if (!(await waitForDeath(pid, 5000))) {
      console.error(`  [FATAL] Zen PID ${pid} survived SIGKILL`);
      killHard(c.geckoPid);
      process.exit(1);
    }
  }
  console.log('     Zen is dead');

  console.log(
    `  3. ${isAlive(c.geckoPid) ? 'Zombie geckodriver detected' : 'Geckodriver died with Zen (no zombie)'}`
  );

  console.log('  4. Running cleanup (close() handles timeout + force-kill)...');
  await c.devTools.close();

  console.log('  5. Verifying geckodriver is dead...');
  if (!(await waitForDeath(c.geckoPid, 5000))) {
    console.error('  [FAIL] Geckodriver still alive after cleanup');
    killHard(c.geckoPid);
    process.exit(1);
  }
  console.log('     Geckodriver is dead');

  console.log('  6. Reconnecting...');
  usedPids.push(c.geckoPid);
  usedPids.push(await reconnect(geckosBefore, usedPids));
  console.log('  Scenario C: PASS\n');

  // Final cleanup
  const leftover = pgrep('geckodriver').filter((p) => !geckosBefore.has(p));
  for (const pid of leftover) {
    killAll(getDescendants(pid));
    killHard(pid);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
