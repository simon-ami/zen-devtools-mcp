# Zen DevTools MCP

[![npm version](https://badge.fury.io/js/zen-devtools-mcp.svg)](https://www.npmjs.com/package/zen-devtools-mcp)
[![CI](https://github.com/simon-ami/zen-devtools-mcp/workflows/CI/badge.svg)](https://github.com/simon-ami/zen-devtools-mcp/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/simon-ami/zen-devtools-mcp/branch/main/graph/badge.svg)](https://codecov.io/gh/simon-ami/zen-devtools-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE-MIT) [![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE-APACHE)

Unofficial Model Context Protocol server for automating Zen Browser via WebDriver BiDi (through Selenium WebDriver). Works with Claude Code, Claude Desktop, Cursor, Cline and other MCP clients.

Repository: https://github.com/simon-ami/zen-devtools-mcp

This is a Zen-first fork of Mozilla's Firefox DevTools MCP server. The public package, CLI, MCP server name, logs, profile paths, and management tools use Zen naming. The lower-level implementation still uses Selenium's Firefox/geckodriver APIs because Gecko automation is exposed through `moz:firefoxOptions`, `Browser.FIREFOX`, and `moz:*` WebDriver BiDi commands.

This project is maintained independently and is not affiliated with or endorsed by Zen Browser.

> **Note**: This MCP server requires a local Zen Browser installation and cannot run on cloud hosting services. Use `npx zen-devtools-mcp@latest` to run locally, or use Docker with the provided Dockerfile.

## Security

Browser MCP servers carry inherent risks. A few key practices:

- **Use a dedicated Zen profile.** Never run the server against your regular profile unless you intentionally use connect-existing mode. The agent has access to whatever the browser can reach, including cookies and saved sessions.
- **Be cautious about which sites you visit.** Pages can return content designed to manipulate the agent (prompt injection). Stick to sites you control or trust.
- **Avoid enabling extra flags unless needed.** `--enable-script` and `--enable-privileged-context` significantly expand what the agent can do.

See [SECURITY.md](SECURITY.md) for a full breakdown of risks and how to report vulnerabilities.

## Requirements

- Node.js >= 20.19.0
- Zen Browser installed (auto-detected on macOS at `/Applications/Zen.app/Contents/MacOS/zen`, or pass `--zen-path`)

## Install and use with Claude Code (npx)

Recommended: use npx so you always run the latest published version from npm.

Option A: Claude Code CLI

```bash
claude mcp add zen-devtools npx zen-devtools-mcp@latest
```

Pass options either as args or env vars. Examples:

```bash
# Headless + viewport via args
claude mcp add zen-devtools npx zen-devtools-mcp@latest -- --headless --viewport 1280x720

# Or via environment variables
claude mcp add zen-devtools npx zen-devtools-mcp@latest \
  --env START_URL=https://example.com \
  --env ZEN_HEADLESS=true
```

Option B: Edit Claude Code settings JSON

Add to your Claude Code config file:

- macOS: `~/Library/Application Support/Claude/Code/mcp_settings.json`
- Linux: `~/.config/claude/code/mcp_settings.json`
- Windows: `%APPDATA%\Claude\Code\mcp_settings.json`

```json
{
  "mcpServers": {
    "zen-devtools": {
      "command": "npx",
      "args": ["-y", "zen-devtools-mcp@latest", "--headless", "--viewport", "1280x720"],
      "env": {
        "START_URL": "about:blank"
      }
    }
  }
}
```

Option C: Helper script (local dev build)

```bash
npm run setup
# Choose Claude Code; the script saves JSON to the right path
```

## Try it with MCP Inspector

```bash
npx @modelcontextprotocol/inspector npx zen-devtools-mcp@latest --start-url https://example.com --headless
```

Then call tools like:

- `list_pages`, `select_page`, `navigate_page`
- `take_snapshot` then `click_by_uid` / `fill_by_uid`
- `list_network_requests` (always-on capture), `get_network_request`
- `screenshot_page`, `list_console_messages`

## CLI options

You can pass flags or environment variables (names on the right):

- `--zen-path` — absolute path to Zen binary (`ZEN_PATH`)
- `--headless` — run without UI (`ZEN_HEADLESS=true`)
- `--viewport 1280x720` — initial window size
- `--profile-path` — parent directory for a dedicated Zen MCP profile
- `--auto-profile` — use a persistent profile under `~/.zen-devtools-mcp`; enabled by default (`AUTO_PROFILE=false` disables it)
- `--zen-arg` — extra Zen arguments (repeatable)
- `--start-url` — open this URL on start (`START_URL`)
- `--accept-insecure-certs` — ignore TLS errors (`ACCEPT_INSECURE_CERTS=true`)
- `--connect-existing` — attach to an already-running Zen instead of launching a new one (`CONNECT_EXISTING=true`)
- `--marionette-port` — Marionette port for connect-existing mode, default 2828 (`MARIONETTE_PORT`)
- `--pref name=value` — set Zen preference at startup via `moz:firefoxOptions` (repeatable)
- `--enable-script` — enable the `evaluate_script` tool (executes arbitrary JavaScript in the page context) and debugging tools (list scripts, inspect source, set logpoints). Debugging tools require Gecko 153+. (`ENABLE_SCRIPT=true`)
- `--enable-privileged-context` — enable privileged context tools: list/select privileged contexts, evaluate privileged scripts, get/set Zen prefs, and list extensions. Requires `MOZ_REMOTE_ALLOW_SYSTEM_ACCESS=1` (`ENABLE_PRIVILEGED_CONTEXT=true`)
- `--log-file` — write MCP server logs to a file instead of stderr. Useful for debugging sessions with MCP clients that hide server output. Set `DEBUG=*` to also include verbose debug logs. Example: `--log-file /tmp/zen-mcp.log`

### Useful preferences (`--pref`)

- remote.prefs.recommended=false. When Zen runs in automation, it applies Gecko [RecommendedPreferences](https://searchfox.org/firefox-main/source/remote/shared/RecommendedPreferences.sys.mjs) that modify browser behavior for testing. Set remote.prefs.recommended to false to skip those and have a configuration closer to a regular Zen instance.
- remote.log.level=Trace. Enable verbose WebDriver protocol logs in Zen. The MCP server will automatically pass the matching log level to geckodriver so both sides log at the same verbosity.
- app.update.disabledForTesting=false. Allow Zen to automatically download and apply updates. Note that updates may interrupt your session. Requires also setting remote.prefs.recommended=false.

### Connect to existing Zen

Use `--connect-existing` to automate your real browsing session with cookies, logins, and open tabs intact:

```bash
# Start Zen with Marionette enabled
/Applications/Zen.app/Contents/MacOS/zen --marionette

# Run the MCP server
npx zen-devtools-mcp --connect-existing --marionette-port 2828
```

Or set `marionette.enabled` to `true` in `about:config` (or `user.js`) to enable Marionette on every launch.

BiDi-dependent features (console events, network events) are not available in connect-existing mode; all other features work normally.

> **Warning:** Do not leave Marionette enabled during normal browsing. It sets
> `navigator.webdriver = true` and changes other browser fingerprint signals,
> which can trigger bot detection on sites protected by Cloudflare, Akamai, etc.
> Only enable Marionette when you need MCP automation, then restart Zen normally
> afterward.

## Tool overview

- Pages: list/new/navigate/select/close
- Snapshot/UID: take/resolve/clear
- Input: click/hover/fill/drag/upload/form fill
- Network: list/get (ID-first, filters, always-on capture)
- Console: list/clear
- Screenshot: page/by uid (with optional `saveTo` for CLI environments)
- Script: evaluate_script
- Privileged Context: list/select privileged ("chrome") contexts, evaluate_privileged_script (requires `MOZ_REMOTE_ALLOW_SYSTEM_ACCESS=1`)
- WebExtension: install_extension, uninstall_extension, list_extensions (list requires `MOZ_REMOTE_ALLOW_SYSTEM_ACCESS=1`)
- Zen Management: get_zen_info, get_zen_output, restart_zen, set_zen_prefs, get_zen_prefs
- Profiler: profiler_is_active, profiler_start (preset or explicit config), profiler_stop (saves profile to downloads directory)
- Utilities: accept/dismiss dialog, history back/forward, set viewport

### Screenshot optimization for Claude Code

When using screenshots in Claude Code CLI, the base64 image data can consume significant context.
Use the `saveTo` parameter to save screenshots to disk instead:

```
screenshot_page({ saveTo: "/tmp/page.png" })
screenshot_by_uid({ uid: "abc123", saveTo: "/tmp/element.png" })
```

The file can then be viewed with Claude Code's `Read` tool without impacting context size.

## Local development

```bash
npm install
npm run build

# Run with Inspector against local build
npx @modelcontextprotocol/inspector node dist/index.js --headless --viewport 1280x720

# Or run in dev with hot reload
npm run inspector:dev
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for more details on local development, testing, and CI.

## Troubleshooting

- Zen not found: pass `--zen-path "/Applications/Zen.app/Contents/MacOS/zen"` (macOS) or the correct path on your OS.
- First run is slow: Selenium sets up the BiDi session; subsequent runs are faster.
- Stale UIDs after navigation: take a fresh snapshot (`take_snapshot`) before using UID tools.
- Windows 10: Error during discovery for MCP server 'zen-devtools': MCP error -32000: Connection closed
  - **Solution 1** Wrap with `cmd /c` ([details](https://github.com/modelcontextprotocol/servers/issues/1082#issuecomment-2791786310)):

    ```json
    "mcpServers": {
      "zen-devtools": {
        "command": "cmd",
        "args": ["/c", "npx", "-y", "zen-devtools-mcp@latest"]
      }
    }
    ```

  - **Solution 2** Use the absolute path to `npx` (adjust extension: `.cmd`, `.bat`, `.exe`, or `.ps1`, to match your setup):

    ```json
    "mcpServers": {
      "zen-devtools": {
        "command": "C:\\nvm4w\\nodejs\\npx.ps1",
        "args": ["-y", "zen-devtools-mcp@latest"]
      }
    }
    ```

## Versioning

- Pre-1.0 API: versions start at `0.x`. Use `@latest` with npx for the newest release.
- This fork uses its own version line rather than upstream Firefox DevTools MCP version numbers.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for how to file issues, run tests, and work on the project locally.

## Author

Maintained independently by [Simon Ami](https://github.com/simon-ami). Based on Mozilla's Firefox DevTools MCP server.

## License

Licensed under either of [MIT](LICENSE-MIT) or [Apache 2.0](LICENSE-APACHE) at your option.
