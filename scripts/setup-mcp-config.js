#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

function detectNodePath() {
  const nvmDir = process.env.NVM_DIR;
  if (nvmDir) {
    try {
      const currentVersion = execSync('nvm current', { encoding: 'utf8' }).trim();
      const nodePath = path.join(nvmDir, 'versions', 'node', currentVersion, 'bin', 'node');
      if (fs.existsSync(nodePath)) {
        return nodePath;
      }
    } catch {
      // Continue with process.execPath.
    }
  }
  return process.execPath || 'node';
}

function defaultZenPath() {
  if (process.platform !== 'darwin') {
    return '';
  }
  const candidate = '/Applications/Zen.app/Contents/MacOS/zen';
  return fs.existsSync(candidate) ? candidate : '';
}

function claudeCodeConfigPath() {
  if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'Code', 'mcp_settings.json');
  }
  if (process.platform === 'win32') {
    return path.join(os.homedir(), 'AppData', 'Roaming', 'Claude', 'Code', 'mcp_settings.json');
  }
  return path.join(os.homedir(), '.config', 'claude', 'code', 'mcp_settings.json');
}

async function main() {
  console.log(`${colors.bright}${colors.blue}Zen DevTools MCP Configuration Setup${colors.reset}\n`);

  const projectPath = path.resolve(__dirname, '..');
  const distIndexPath = path.join(projectPath, 'dist', 'index.js');

  if (!fs.existsSync(distIndexPath)) {
    console.log(`${colors.yellow}Dist file not found. Building project...${colors.reset}`);
    execSync('npm run build', { cwd: projectPath, stdio: 'inherit' });
  }

  if (!fs.existsSync(distIndexPath)) {
    throw new Error(`Dist file not found at ${distIndexPath}`);
  }

  const detectedZenPath = defaultZenPath();
  const zenPath =
    (await question(
      `Zen executable path${detectedZenPath ? ` [${detectedZenPath}]` : ''}: `
    )) ||
    detectedZenPath;
  const headless = (await question('Run in headless mode? (y/n) [n]: ')) || 'n';
  const viewport = (await question('Viewport size [1280x720]: ')) || '1280x720';
  const nodePath = detectNodePath();

  const args = [
    distIndexPath,
    `--headless=${headless.toLowerCase() === 'y' ? 'true' : 'false'}`,
    `--viewport=${viewport}`,
  ];
  if (zenPath) {
    args.push(`--zen-path=${zenPath}`);
  }

  const mcpConfig = {
    mcpServers: {
      'zen-devtools': {
        command: nodePath,
        args,
        env: {
          START_URL: 'about:blank',
        },
      },
    },
  };

  const configPath = claudeCodeConfigPath();
  const configDir = path.dirname(configPath);
  const displayOnly = ((await question('Write Claude Code config? (y/n) [y]: ')) || 'y')
    .trim()
    .toLowerCase()
    .startsWith('n');

  if (displayOnly) {
    console.log(JSON.stringify(mcpConfig, null, 2));
    rl.close();
    return;
  }

  let existingConfig = {};
  if (fs.existsSync(configPath)) {
    existingConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }

  const finalConfig = {
    ...existingConfig,
    mcpServers: {
      ...existingConfig.mcpServers,
      ...mcpConfig.mcpServers,
    },
  };

  fs.mkdirSync(configDir, { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(finalConfig, null, 2));
  console.log(`${colors.green}Configuration saved to ${configPath}${colors.reset}`);
  rl.close();
}

main().catch((error) => {
  console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
  rl.close();
  process.exit(1);
});
