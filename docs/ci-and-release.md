# CI And Release

CI runs linting, formatting checks, typechecking, build, and unit tests. It intentionally does not run browser integration tests because hosted runners do not provide Zen Browser.

Releases follow the upstream two-step shape, adapted for this fork:

1. Pushing a `v*` tag runs the release workflow. It builds, runs unit tests, and creates a GitHub release with generated release notes, matching the upstream release-page style.
2. Publishing a GitHub release runs the npm publish workflow. It typechecks, lints, checks formatting, runs unit tests, builds, and publishes the single `zen-devtools-mcp` package with npm provenance. If that exact package version is already published, the workflow skips npm publishing instead of failing.

This fork does not publish any Mozilla package names or the upstream privileged `moz` package.

## npm Setup

The package `zen-devtools-mcp` exists on npm and is configured for GitHub Actions trusted publishing from `simon-ami/zen-devtools-mcp` using `.github/workflows/publish.yml`.

For a new fork or renamed package, npm needs a package settings page before trusted publishing can be configured. If npm does not let you create the package from the web UI, do one initial manual publish from a clean local checkout after signing in:

```bash
npm login
npm whoami
npm publish --access public
```

After the package exists, configure trusted publishing with npm CLI:

```bash
npm trust github zen-devtools-mcp \
  --repo simon-ami/zen-devtools-mcp \
  --file publish.yml \
  --allow-publish
```

This requires account-level 2FA and npm `11.15.0` or newer. See npm's trusted publishing docs for the current requirements and UI alternative: https://docs.npmjs.com/trusted-publishers/

The equivalent npm web UI settings are:

1. Open the package settings for `zen-devtools-mcp`.
2. Add a trusted publisher:
   - Provider: GitHub Actions
   - Organization or user: `simon-ami`
   - Repository: `zen-devtools-mcp`
   - Workflow: `publish.yml`
   - Allowed action: `npm publish`
   - Environment: leave blank unless the workflow is changed to use one

If trusted publishing is unavailable, use an npm automation token as a fallback by adding a repository secret named `NPM_TOKEN` and updating the publish workflow to pass it as `NODE_AUTH_TOKEN`.

## Cutting A Release

Update `package.json`, `package-lock.json`, and `CHANGELOG.md`, then tag and push:

```bash
npm version patch
git push origin main --tags
```

Use `minor` or `major` instead of `patch` when the public CLI, MCP tools, or package behavior changes accordingly.
