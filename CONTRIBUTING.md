# Contributing to Zen DevTools MCP

## Issues

Issues are tracked in this repository's [GitHub issues](https://github.com/simon-ami/zen-devtools-mcp/issues).

- [File a new issue](https://github.com/simon-ami/zen-devtools-mcp/issues/new)

For questions and discussion, use GitHub issues.

## Local development

```bash
npm install
npm run build

# Run with Inspector against local build
npx @modelcontextprotocol/inspector node dist/index.js \
  --zen-path /Applications/Zen.app/Contents/MacOS/zen \
  --headless \
  --viewport 1280x720

# Or run in dev with hot reload
npm run inspector:dev
```

## Testing

```bash
npm run test:unit         # unit tests once
npm test                  # watch mode
```

See [docs/testing.md](docs/testing.md) for full details on running checks, local browser validation, and CI test coverage.

## CI and Release

GitHub Actions for CI, Release, and npm publish are included. See [docs/ci-and-release.md](docs/ci-and-release.md) for details and required setup.

## Code of Conduct

This project follows the [Community Participation Guidelines](CODE_OF_CONDUCT.md).

## License

By contributing, you agree that your contributions will be dual-licensed under [MIT](LICENSE-MIT) and [Apache 2.0](LICENSE-APACHE), matching the project's license.
