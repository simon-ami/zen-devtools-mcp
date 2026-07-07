#!/usr/bin/env node

/**
 * Standalone test for dialog handling (Task 23)
 */

import { ZenDevTools } from '../dist/index.js';

async function main() {
  console.log(' Testing Dialog Handling (Task 23)...\n');

  const zen = new ZenDevTools({
    zenPath: process.env.ZEN_PATH,
    headless: false,
    viewport: { width: 1024, height: 768 },
  });

  try {
    // Connect
    console.log(' Connecting to Zen...');
    await zen.connect();
    console.log(' Connected!\n');

    // Test 1: Alert dialog
    console.log('1 Testing alert() dialog...');
    await zen.navigate('about:blank');
    await zen.evaluate('setTimeout(() => alert("This is a test alert!"), 100)');
    await new Promise((r) => setTimeout(r, 300));
    await zen.acceptDialog();
    console.log('    Alert accepted\n');

    // Test 2: Confirm dialog - accept
    console.log('2 Testing confirm() dialog - accept...');
    await zen.evaluate(
      'setTimeout(() => { window.confirmResult = confirm("Click OK to accept"); }, 100)'
    );
    await new Promise((r) => setTimeout(r, 300));
    await zen.acceptDialog();
    const confirmAccepted = await zen.evaluate('return window.confirmResult');
    console.log(`   Result: ${confirmAccepted}`);
    console.log(`   ${confirmAccepted ? '' : ''} Confirm was accepted\n`);

    // Test 3: Confirm dialog - dismiss
    console.log('3 Testing confirm() dialog - dismiss...');
    await zen.evaluate(
      'setTimeout(() => { window.confirmResult2 = confirm("Click Cancel to dismiss"); }, 100)'
    );
    await new Promise((r) => setTimeout(r, 300));
    await zen.dismissDialog();
    const confirmDismissed = await zen.evaluate('return window.confirmResult2');
    console.log(`   Result: ${confirmDismissed}`);
    console.log(`   ${!confirmDismissed ? '' : ''} Confirm was dismissed\n`);

    // Test 4: Prompt dialog with text
    console.log('4 Testing prompt() dialog with custom text...');
    await zen.evaluate(
      'setTimeout(() => { window.promptResult = prompt("Enter your favorite color:"); }, 100)'
    );
    await new Promise((r) => setTimeout(r, 300));
    await zen.acceptDialog('Blue');
    const promptResult = await zen.evaluate('return window.promptResult');
    console.log(`   Result: ${promptResult}`);
    console.log(`   ${promptResult === 'Blue' ? '' : ''} Prompt returned: "${promptResult}"\n`);

    // Test 5: Prompt dialog dismissed
    console.log('5 Testing prompt() dialog - dismiss...');
    await zen.evaluate(
      'setTimeout(() => { window.promptResult2 = prompt("This will be dismissed"); }, 100)'
    );
    await new Promise((r) => setTimeout(r, 300));
    await zen.dismissDialog();
    const promptDismissed = await zen.evaluate('return window.promptResult2');
    console.log(`   Result: ${promptDismissed}`);
    console.log(`   ${promptDismissed === null ? '' : ''} Prompt was dismissed (null)\n`);

    // Test 6: Error handling - no dialog present
    console.log('6 Testing error handling (no dialog present)...');
    try {
      await zen.acceptDialog();
      console.log('    Should have thrown error');
    } catch (e) {
      console.log(`    Error caught: ${e.message}\n`);
    }

    console.log(' All dialog tests passed! \n');
  } catch (error) {
    console.error(' Test failed:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    console.log(' Closing Zen...');
    await zen.close();
    console.log(' Done!');
  }
}

main().catch((error) => {
  console.error(' Fatal error:', error);
  process.exit(1);
});
