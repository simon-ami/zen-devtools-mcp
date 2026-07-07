# Testing

Run the unit suite without launching a browser:

```bash
npm run test:unit
```

Run all static checks:

```bash
npm run typecheck
npm run lint
npm run format:check
npm run build
```

Browser-level validation should be run locally against Zen:

```bash
npm run build
npx @modelcontextprotocol/inspector node dist/index.js \
  --zen-path /Applications/Zen.app/Contents/MacOS/zen \
  --headless \
  --start-url https://example.com
```

Verify at least `list_pages`, `navigate_page`, `take_snapshot`, `list_console_messages`, `list_network_requests`, and `screenshot_page`.

CI runs unit tests only because GitHub-hosted runners do not provide Zen Browser.
