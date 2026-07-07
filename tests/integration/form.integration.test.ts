/**
 * Integration tests for form interaction
 * Tests with real Zen browser in headless mode
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  createTestZen,
  closeZen,
  waitForElementInSnapshot,
  waitForPageLoad,
} from '../helpers/zen.js';
import type { FirefoxClient as ZenClient } from '@/firefox/index.js';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const fixturesPath = resolve(__dirname, '../fixtures');

describe('Form Interaction Integration Tests', () => {
  let zen: ZenClient;

  beforeAll(async () => {
    zen = await createTestZen();
  }, 30000);

  afterAll(async () => {
    await closeZen(zen);
  });

  it('should hover over element by UID', async () => {
    const fixturePath = `file://${fixturesPath}/form.html`;
    await zen.navigate(fixturePath);

    // Wait for page to be fully loaded
    await waitForPageLoad();

    // Wait for submit button to appear in snapshot
    const submitBtn = await waitForElementInSnapshot(
      zen,
      (entry) => entry.css.includes('#submitBtn') || entry.css.includes('submitBtn'),
      10000
    );

    expect(submitBtn).toBeDefined();

    // Hover should not throw
    await expect(zen.hoverByUid(submitBtn.uid)).resolves.not.toThrow();
  }, 15000);
});
