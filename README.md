# Zen DevTools MCP

Model Context Protocol server for automating Zen Browser through Selenium WebDriver, geckodriver, and WebDriver BiDi.

This is a Zen-first fork of Mozilla's Firefox DevTools MCP server. The public package, CLI, MCP server name, logs, profile paths, and management tools use Zen naming. The lower-level implementation still uses Selenium's Firefox/geckodriver APIs because Gecko automation is exposed through `moz:firefoxOptions`, `Browser.FIREFOX`, and `moz:*` WebDriver BiDi commands.

## Security

Browser MCP servers can expose whatever the browser can access. By default this server launches Zen with an MCP-owned profile under `~/.zen-devtools-mcp`, not your real Zen profile.

Avoid running automation against your normal browsing profile. If you intentionally attach to an existing Zen window, start Zen yourself with Marionette and only keep that mode enabled while you need it.

## Requirements

- Node.js 20.19 or newer
- Zen Browser installed locally
- geckodriver, managed automatically through the `geckodriver` npm package when needed

On this macOS setup, the default Zen binary is:

```bash
/Applications/Zen.app/Contents/MacOS/zen
```

## Local Use

```bash
npm ci
npm run build
```

Add the local build to Claude Code:

```bash
claude mcp add zen-devtools node "$(pwd)/dist/index.js"
```

Or pass options explicitly:

```bash
claude mcp add zen-devtools node "$(pwd)/dist/index.js" -- \
  --zen-path /Applications/Zen.app/Contents/MacOS/zen \
  --headless \
  --viewport 1280x720
```

You can also run the setup helper:

```bash
npm run setup
```

## Inspector

```bash
npm run build
npx @modelcontextprotocol/inspector node dist/index.js --headless --start-url https://example.com
```

## CLI Options

- `--zen-path` — absolute path to the Zen executable (`ZEN_PATH`)
- `--headless` — run without UI (`ZEN_HEADLESS=true`)
- `--viewport 1280x720` — initial window size
- `--profile-path` — parent directory for a dedicated MCP profile
- `--auto-profile` — use a persistent profile under `~/.zen-devtools-mcp`; enabled by default (`AUTO_PROFILE=false` disables it)
- `--zen-arg` — extra Zen arguments, repeatable
- `--start-url` — page opened on startup (`START_URL`)
- `--accept-insecure-certs` — ignore TLS errors (`ACCEPT_INSECURE_CERTS=true`)
- `--connect-existing` — attach to a running Zen instance via Marionette (`CONNECT_EXISTING=true`)
- `--marionette-port` — Marionette port for connect-existing mode, default `2828` (`MARIONETTE_PORT`)
- `--pref name=value` — set Zen preference at startup through `moz:firefoxOptions`, repeatable
- `--enable-script` — enable script/debugging tools; debugging commands require Gecko 153+
- `--enable-privileged-context` — enable privileged tools in the privileged build; requires `MOZ_REMOTE_ALLOW_SYSTEM_ACCESS=1`
- `--log-file` — write MCP server logs to a file

## MCP Tools

Generic browser tools keep their existing names:

- Pages: `list_pages`, `new_page`, `navigate_page`, `select_page`, `close_page`
- Snapshot and UID: `take_snapshot`, `resolve_uid_to_selector`, `clear_snapshot`
- Input: `click_by_uid`, `hover_by_uid`, `fill_by_uid`, `drag_by_uid_to_uid`, `fill_form_by_uid`, `upload_file_by_uid`
- Network and console: `list_network_requests`, `get_network_request`, `list_console_messages`, `clear_console_messages`
- Screenshot and utilities: `screenshot_page`, `screenshot_by_uid`, `accept_dialog`, `dismiss_dialog`, `navigate_history`, `set_viewport_size`

Zen-specific management tools:

- `get_zen_info`
- `get_zen_output`
- `restart_zen`
- `set_zen_prefs`
- `get_zen_prefs`

## Existing Zen Session

Connect-existing mode attaches to Zen through Marionette:

```bash
/Applications/Zen.app/Contents/MacOS/zen --marionette
node dist/index.js --connect-existing --marionette-port 2828
```

Do not leave Marionette enabled for normal browsing. It changes browser automation signals such as `navigator.webdriver`.

## Version Notes

The installed local Zen checked during this port was `1.21.5b` on Gecko `152.0.4`. The server reports both values in `get_zen_info`.

Optional tools using `moz:debugging` require Gecko 153+. The profiler tools require Gecko 154+. On Gecko 152.0.4 those tools return explicit unsupported-version errors while the standard page, input, console, network, and screenshot tools remain available.

## Development

```bash
npm run typecheck
npm run lint
npm run format:check
npm run test:unit
npm run build
```

The CI workflow runs unit tests only. Run local smoke tests against an installed Zen binary for browser-level verification.
