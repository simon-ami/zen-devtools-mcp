---
name: navigate
description: Navigate Zen to a URL and take a DOM snapshot for interaction
argument-hint: <url>
---

# /zen-devtools-mcp:navigate

Opens a URL in Zen and takes a DOM snapshot for interaction.

## Usage

```
/zen-devtools-mcp:navigate <url>
```

## Examples

```
/zen-devtools-mcp:navigate https://example.com
/zen-devtools-mcp:navigate https://github.com/login
/zen-devtools-mcp:navigate file:///path/to/local.html
```

## What Happens

1. Calls `navigate_page` with the URL
2. Waits for page load
3. Calls `take_snapshot` to create UID mappings
4. Returns the DOM snapshot with interactive elements marked

After navigating, you can interact with elements using their UIDs (e.g., `e42`).
