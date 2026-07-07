# Contributing

This repository is a personal Zen-focused fork of the Firefox DevTools MCP server.

## Local Development

```bash
npm ci
npm run build
npm run test:unit
```

Run a local browser smoke test against Zen before relying on browser-facing changes:

```bash
npx @modelcontextprotocol/inspector node dist/index.js \
  --zen-path /Applications/Zen.app/Contents/MacOS/zen \
  --headless
```

## Checks

```bash
npm run typecheck
npm run lint
npm run format:check
npm run test:unit
npm run build
```

## Release

npm publishing is disabled for this fork. See [docs/ci-and-release.md](docs/ci-and-release.md).
