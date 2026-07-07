# Zen Client Architecture

The MCP server drives Zen through Selenium WebDriver, geckodriver, and WebDriver BiDi.

## Protocol

Zen is Gecko-based, so automation still uses Selenium's Firefox support:

```typescript
new Builder().forBrowser(Browser.FIREFOX).setFirefoxOptions(opts).build();
```

The public server names are Zen-specific, but protocol-level names such as `moz:firefoxOptions` and `moz:*` remain unchanged because they are Gecko WebDriver APIs.

## Modules

`src/firefox/index.ts` exposes `ZenDevTools` while delegating to the existing modular client:

| Module | Responsibilities |
|--------|------------------|
| `core.ts` | WebDriver, geckodriver, BiDi connection lifecycle, Zen/Gecko version detection |
| `dom.ts` | JS evaluation, element lookup, input actions |
| `pages.ts` | Tab/window management, navigation, history, viewport |
| `events/*` | Console, network, and debugging event buffers |
| `snapshot/*` | UID snapshot generation and resolution |

## Configuration

The default macOS Zen executable is `/Applications/Zen.app/Contents/MacOS/zen`.

`--auto-profile` is enabled by default and uses a persistent MCP profile under `~/.zen-devtools-mcp`. User-supplied `--profile-path` values are treated as parent directories; the server creates `zen_devtools_mcp_profile` inside them.

## Versions

`get_zen_info` reports both Zen app version and Gecko version. Optional `moz:debugging` and `moz:profiler` tools gate on Gecko version, not Zen app version.
