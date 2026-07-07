#!/usr/bin/env node

import { ZenDevTools } from '../dist/index.js';

async function test() {
  console.log('=== Test: Start Zen and navigate ===\n');

  const zen = new ZenDevTools({
    headless: false,
    zenPath: process.env.ZEN_PATH,
  });

  await zen.connect();
  console.log(' Zen started');

  await zen.navigate('https://example.com');
  console.log(' Navigated to example.com');

  await new Promise(resolve => setTimeout(resolve, 2000));

  await zen.navigate('https://mozilla.org');
  console.log(' Navigated to mozilla.org');

  await new Promise(resolve => setTimeout(resolve, 2000));

  await zen.refreshTabs();
  const tabs = zen.getTabs();
  console.log(` Listed tabs: ${tabs.length} tab(s)`);
  if (tabs.length > 0) {
    console.log(`  Current URL: ${tabs[0].url}`);
    console.log(`  Current title: ${tabs[0].title || 'N/A'}`);
  }

  await new Promise(resolve => setTimeout(resolve, 2000));

  await zen.navigate('https://www.w3.org');
  console.log(' Navigated to w3.org');

  await new Promise(resolve => setTimeout(resolve, 2000));

  await zen.refreshTabs();
  const tabsAfter = zen.getTabs();
  console.log(` Listed tabs again: ${tabsAfter.length} tab(s)`);
  if (tabsAfter.length > 0) {
    console.log(`  Current URL: ${tabsAfter[0].url}`);
  }

  await zen.close();
  console.log('\n Basic navigation tests passed!');
  console.log('\nNote: To test restart_zen with logs, use the MCP inspector:');
  console.log('  npm run inspector');
}

test().catch(err => {
  console.error('\nTest failed:', err);
  process.exit(1);
});
