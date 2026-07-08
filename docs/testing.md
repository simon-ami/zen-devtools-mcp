# Testing

## Running tests

```bash
# Run all tests once (unit + integration)
npm run test:run

# Run only unit tests (fast, no Zen needed)
npm run test:unit

# Run only integration tests (launches real Zen in headless mode)
npx vitest run tests/integration

# Run the e2e scenario suite
npx vitest run tests/integration/e2e-scenario.integration.test.ts

# Watch mode (re-runs on file changes)
npm test
```

Run all static checks:

```bash
npm run typecheck
npm run lint
npm run format:check
npm run build
```

## Browser validation

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

## E2E scenario tests

The file `tests/integration/e2e-scenario.integration.test.ts` contains end-to-end tests that exercise the full browser client API against a realistic multi-page web application (`tests/fixtures/e2e-app.html`).

The fixture app has three pages (Todo List, Search, Registration Form) plus always-visible hover/double-click targets. Each `describe` block launches its own headless Zen instance and tears it down after the tests.

All tests are self-contained (no ordering dependencies) and use active polling (`waitFor`) instead of fixed sleeps for async BiDi events.

### Design principles

- **Self-contained**: each test navigates to its own page, no inter-test dependencies
- **Active polling**: async events (console, network) use `waitFor` instead of fixed sleeps
- **Relative assertions**: viewport tests assert relative change, not exact pixel values (platform-dependent)
- **Isolated Zen instances**: each `describe` block gets its own headless Zen
