# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-07-11

### Added

- Added an MCPB build target and Zen-specific Claude plugin marketplace packaging.
- Added a companion plugin for diagnosing Claude plugin setup problems.

### Fixed

- Server name and package version are now injected correctly at build time.
- Release archives now include the actual MIT and Apache license files.
- Releases now trigger npm publishing without relying on an unauthorized action.

### Changed

- Restructured Claude plugin files to support a multi-plugin marketplace.
- Added Claude Cowork installation documentation.

## [0.1.1] - 2026-07-08

### Fixed

- Added a clear `--connect-existing` error when Zen is not reachable on the Marionette port.
- Fixed profile guidance to point users at `--marionette` for existing Zen sessions.
- Updated test cleanup to target Zen browser processes.

### Changed

- Cleaned up stale Firefox-facing labels in agent docs, fixtures, and inherited comments.
- Aligned project governance, security, testing, release, and Codecov documentation with this fork.

## [0.1.0] - 2026-07-07

### Added

- Forked the MCP server into a Zen-first package named `zen-devtools-mcp`.
- Added Zen defaults for package metadata, CLI, MCP server name, log namespace, profile directories, and management tools.
- Added explicit geckodriver resolution for Zen launches so Selenium Manager does not infer driver versions from Zen's app version.
- Added Zen and Gecko version detection from Zen app resources.
- Renamed public management tools to `get_zen_info`, `get_zen_output`, `restart_zen`, `set_zen_prefs`, and `get_zen_prefs`.
- Removed public Firefox Android CLI/docs from this fork.
- Replaced inherited npm publishing with a Zen-only publish workflow for `zen-devtools-mcp`.
