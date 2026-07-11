# Zen DevTools Plugin for Claude Code

Control Zen for automated browsing, web testing, and debugging. Navigate pages, fill forms, click elements, take screenshots, and monitor console/network activity.

## What's Included

- **MCP Server** - Connects Claude Code to Zen via WebDriver BiDi
- **Skill** - Auto-triggers for browser automation, testing, and debugging tasks
- **Agents** - Dedicated `e2e-tester` and `web-extractor` agents for focused tasks
- **Commands** - `/zen-devtools-mcp:navigate`, `/zen-devtools-mcp:screenshot`, `/zen-devtools-mcp:debug`

## Installation

```bash
/plugin marketplace add simon-ami/zen-devtools-mcp
/plugin install zen-devtools-mcp@zen-devtools-plugins
```

## Commands

### /zen-devtools-mcp:navigate

Navigate to a URL and take a DOM snapshot:

```
/zen-devtools-mcp:navigate https://example.com
/zen-devtools-mcp:navigate https://github.com/login
```

### /zen-devtools-mcp:screenshot

Capture the current page or a specific element:

```
/zen-devtools-mcp:screenshot
/zen-devtools-mcp:screenshot e15
```

### /zen-devtools-mcp:debug

Show console errors and failed network requests:

```
/zen-devtools-mcp:debug
/zen-devtools-mcp:debug console
/zen-devtools-mcp:debug network
```

## Agents

Spawn agents to keep your main context clean:

```
spawn e2e-tester to test the login flow on https://app.example.com
spawn web-extractor to extract product prices from https://shop.example.com
```

## Usage Examples

The plugin works automatically when you ask about browser tasks:

- "Navigate to example.com and take a screenshot"
- "Fill out the login form and submit"
- "Check for JavaScript errors on this page"
- "Extract all product prices from this page"

## Key Workflow

1. `take_snapshot` - Creates DOM snapshot with UIDs (e.g., `e42`)
2. Interact using UIDs - `click_by_uid`, `fill_by_uid`, etc.
3. Re-snapshot after DOM changes

## Default Configuration

The plugin enables the following by default:

- **`--enable-script`** — enables JavaScript evaluation and debugging tools (`evaluate_script`, logpoints, script inspection). Requires Gecko 153+.
- **`remote.prefs.recommended=false`** — skips WebDriver's automation preferences so Zen behaves closer to a regular browser session. See [RecommendedPreferences](https://searchfox.org/firefox-main/source/remote/shared/RecommendedPreferences.sys.mjs) for what those preferences do.

## Requirements

- Gecko 153+ (for script tools) or Zen Browser (without script tools)
- Node.js 20.19.0+

## Links

- [Repository](https://github.com/simon-ami/zen-devtools-mcp)
- [npm](https://www.npmjs.com/package/@simon-ami/zen-devtools-mcp)
