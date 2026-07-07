#!/usr/bin/env node

import { ZenDevTools } from '../dist/index.js';

async function test() {
  console.log('=== Test: Privileged Context Script Evaluation (headless) ===\n');

  const zen = new ZenDevTools({
    headless: true,
    zenPath: process.env.ZEN_PATH,
    env: {
      MOZ_REMOTE_ALLOW_SYSTEM_ACCESS: '1',
    },
  });

  await zen.connect();
  console.log(' Zen started with MOZ_REMOTE_ALLOW_SYSTEM_ACCESS=1');

  // Test content script first
  console.log('\n--- Testing content script (default context) ---');
  await zen.navigate('https://example.com');
  await new Promise((resolve) => setTimeout(resolve, 2000));

  try {
    const title = await zen.evaluate('return document.title');
    console.log(` Content context: document.title = "${title}"`);
  } catch (err) {
    console.log(` Content script failed: ${err.message}`);
  }

  // Now test privileged context via BiDi with moz:scope
  console.log('\n--- Testing privileged context listing ---');

  try {
    // Use BiDi to list privileged contexts with moz:scope
    const result = await zen.sendBiDiCommand('browsingContext.getTree', {
      'moz:scope': 'chrome',
    });

    const contexts = result.contexts || [];
    console.log(` Listed ${contexts.length} privileged context(s) via BiDi`);

    if (contexts.length > 0) {
      console.log('  Sample privileged contexts:');
      contexts.slice(0, 3).forEach((ctx) => {
        console.log(`    ${ctx.context}: ${ctx.url || '(no url)'}`);
      });

      // Try to evaluate in privileged context
      console.log('\n--- Testing privileged script execution ---');

      const driver = zen.getDriver();
      const firstContext = contexts[0];

      // Switch to chrome browsing context
      await driver.switchTo().window(firstContext.context);
      console.log(` Switched to privileged context: ${firstContext.context}`);

      // Set Marionette context to chrome
      try {
        await driver.setContext('chrome');
        console.log(' Set Marionette context to "chrome"');

        // Now try to evaluate chrome-privileged script
        const appName = await driver.executeScript('return Services.appinfo.name;');
        console.log(` Privileged script: Services.appinfo.name = "${appName}"`);

        const version = await driver.executeScript('return Services.appinfo.version;');
        console.log(` Privileged script: Services.appinfo.version = "${version}"`);

        const buildID = await driver.executeScript('return Services.appinfo.appBuildID;');
        console.log(` Privileged script: Services.appinfo.appBuildID = "${buildID}"`);

        console.log('\n Privileged context evaluation WORKS!');
      } catch (err) {
        console.log(` Failed to set privileged context: ${err.message}`);
        console.log('  Your Zen build may not support privileged context');
      }
    } else {
      console.log('  No privileged contexts found (requires dev/nightly build)');
    }
  } catch (err) {
    if (err.message && err.message.includes('UnsupportedOperationError')) {
      console.log(' Privileged context not supported by this Zen build');
      console.log('  Requires Zen Nightly or custom build');
    } else {
      console.log(` Privileged context test failed: ${err.message}`);
    }
  }

  await zen.close();
  console.log('\n Test completed');
}

test().catch((err) => {
  console.error('\nTest failed:', err);
  console.error(err.stack);
  process.exit(1);
});
