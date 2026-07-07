/**
 * Integration tests for tab management
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

describe('Tab Management Integration Tests', () => {
  let zen: ZenClient;

  beforeAll(async () => {
    zen = await createTestZen();
  }, 30000);

  afterAll(async () => {
    await closeZen(zen);
  });

  it('should list tabs', async () => {
    const fixturePath = `file://${fixturesPath}/simple.html`;
    await zen.navigate(fixturePath);

    await zen.refreshTabs();
    const tabs = zen.getTabs();

    expect(tabs).toBeDefined();
    expect(Array.isArray(tabs)).toBe(true);
    expect(tabs.length).toBeGreaterThan(0);
  }, 15000);

  it('should create new tab', async () => {
    await zen.refreshTabs();
    const initialTabs = zen.getTabs();
    const initialTabCount = initialTabs.length;

    const fixturePath = `file://${fixturesPath}/simple.html`;
    const newTabIndex = await zen.createNewPage(fixturePath);

    await zen.refreshTabs();
    const updatedTabs = zen.getTabs();

    expect(updatedTabs.length).toBe(initialTabCount + 1);
    expect(typeof newTabIndex).toBe('number');
    expect(newTabIndex).toBeGreaterThanOrEqual(0);
  }, 15000);

  it('should switch between tabs', async () => {
    await zen.refreshTabs();
    const initialTabs = zen.getTabs();

    // Create second tab
    const fixturePath = `file://${fixturesPath}/form.html`;
    const newTabIndex = await zen.createNewPage(fixturePath);

    await zen.refreshTabs();

    // Switch to new tab
    await zen.selectTab(newTabIndex);

    const selectedIdx = zen.getSelectedTabIdx();
    expect(selectedIdx).toBe(newTabIndex);

    // Switch back to first tab
    await zen.selectTab(0);

    const newSelectedIdx = zen.getSelectedTabIdx();
    expect(newSelectedIdx).toBe(0);
  }, 20000);

  it('should close tab', async () => {
    await zen.refreshTabs();
    const initialTabs = zen.getTabs();

    if (initialTabs.length < 2) {
      // Create additional tab if needed
      const fixturePath = `file://${fixturesPath}/simple.html`;
      await zen.createNewPage(fixturePath);
      await zen.refreshTabs();
    }

    const tabsBeforeClose = zen.getTabs();
    const tabCountBeforeClose = tabsBeforeClose.length;

    // Close the last tab (not the current one)
    const lastTabIndex = tabCountBeforeClose - 1;
    await zen.closeTab(lastTabIndex);

    await zen.refreshTabs();
    const tabsAfterClose = zen.getTabs();

    expect(tabsAfterClose.length).toBe(tabCountBeforeClose - 1);
  }, 20000);

  it('should have snapshot isolation between tabs', async () => {
    // Create two tabs with different pages
    const simplePath = `file://${fixturesPath}/simple.html`;
    const formPath = `file://${fixturesPath}/form.html`;

    await zen.navigate(simplePath);
    await waitForPageLoad();
    const tab1Index = zen.getSelectedTabIdx();

    const tab2Index = await zen.createNewPage(formPath);
    await zen.selectTab(tab2Index);
    await waitForPageLoad();

    // Wait for form elements to appear in tab 2
    const emailElement = await waitForElementInSnapshot(
      zen,
      (entry) => entry.css.includes('#email') || entry.css.includes('email'),
      10000
    );

    expect(emailElement).toBeDefined();

    // Take snapshot in tab 2 (form page)
    const snapshot2 = await zen.takeSnapshot();
    const formElements = snapshot2.json.uidMap.filter(
      (entry) => entry.css.includes('#email') || entry.css.includes('email')
    );

    expect(formElements.length).toBeGreaterThan(0);

    // Switch to tab 1 (simple page)
    await zen.selectTab(tab1Index);
    await waitForPageLoad();

    // Wait for button to appear in tab 1
    const clickBtnElement = await waitForElementInSnapshot(
      zen,
      (entry) => entry.css.includes('#clickBtn') || entry.css.includes('clickBtn'),
      10000
    );

    expect(clickBtnElement).toBeDefined();

    // Take snapshot in tab 1
    const snapshot1 = await zen.takeSnapshot();
    const simpleElements = snapshot1.json.uidMap.filter(
      (entry) => entry.css.includes('#clickBtn') || entry.css.includes('clickBtn')
    );

    expect(simpleElements.length).toBeGreaterThan(0);

    // Snapshot IDs should be different
    expect(snapshot1.json.snapshotId).not.toBe(snapshot2.json.snapshotId);
  }, 30000);

  it('should get selected tab index', async () => {
    await zen.refreshTabs();
    const selectedIdx = zen.getSelectedTabIdx();

    expect(typeof selectedIdx).toBe('number');
    expect(selectedIdx).toBeGreaterThanOrEqual(0);
  }, 10000);
});
