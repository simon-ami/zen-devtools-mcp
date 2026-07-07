import { ZenDevTools } from '../dist/index.js';

async function main() {
  const zen = new ZenDevTools({
    headless: true,
    enableBidiLogging: false,
    width: 1280,
    height: 720,
  });

  console.log('Connecting...');
  await zen.connect();
  console.log('Connected!');
  await zen.close();
  console.log('Done!');
}

main().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
