# Changelog

## 0.1.1

- Added a clear `--connect-existing` error when Zen is not reachable on the Marionette port.
- Fixed profile guidance to point users at `--marionette` for existing Zen sessions.
- Updated test cleanup to target Zen browser processes.
- Cleaned up stale Firefox-facing labels in agent docs, fixtures, and inherited comments.
- Aligned project governance, security, testing, release, and Codecov documentation with this fork.

## 0.1.0

- Forked the MCP server into a Zen-first package named `zen-devtools-mcp`.
- Added Zen defaults for package metadata, CLI, MCP server name, log namespace, profile directories, and management tools.
- Added explicit geckodriver resolution for Zen launches so Selenium Manager does not infer driver versions from Zen's app version.
- Added Zen and Gecko version detection from Zen app resources.
- Renamed public management tools to `get_zen_info`, `get_zen_output`, `restart_zen`, `set_zen_prefs`, and `get_zen_prefs`.
- Removed public Firefox Android CLI/docs from this fork.
- Replaced inherited npm publishing with a Zen-only publish workflow for `zen-devtools-mcp`.
