# CI And Release

CI runs linting, formatting checks, typechecking, build, and unit tests. It intentionally does not run browser integration tests because hosted runners do not provide Zen Browser.

npm publishing is disabled for this personal fork. The inherited Mozilla publish workflow has been replaced with a no-op workflow so it cannot publish the original package name accidentally.

Release archives, if created from tags, use `zen-devtools-mcp-*` filenames and include `dist`, `package.json`, `README.md`, and both license files.
