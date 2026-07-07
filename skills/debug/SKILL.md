---
description: Show console errors and failed network requests
argument-hint: [console|network|all]
---

# /zen-devtools-mcp:debug

Displays debugging information from the current page.

## Usage

```
/zen-devtools-mcp:debug              # Show all (console errors + failed requests)
/zen-devtools-mcp:debug console      # Console messages only
/zen-devtools-mcp:debug network      # Network requests only
```

## Examples

```
/zen-devtools-mcp:debug
/zen-devtools-mcp:debug console
/zen-devtools-mcp:debug network
```

## What Happens

- `console`: Calls `list_console_messages` with `level="error"`
- `network`: Calls `list_network_requests` with `statusMin=400`
- `all` (default): Shows both console errors and failed network requests

Requires Zen to already be running and on the page you want to debug. If Zen is not running or is on about:blank, call `navigate_page` first.
