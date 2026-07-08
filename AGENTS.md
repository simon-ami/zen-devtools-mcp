# Project rules

- Never use emojis anywhere: code, comments, log messages, strings, documentation.
- Never add `Co-Authored-By` or any AI attribution to commit messages.
- Limit comments to a strict minimum. Almost never add comments, except on non-trivial code, non-self-explanatory function arguments, and class definitions.
- Do not remove existing comments unless they are directly related to what you are changing.
- For releases, update `package.json`, `package-lock.json`, and `CHANGELOG.md`, create and push a `v*` tag, then publish the GitHub release; npm publishing happens from `publish.yml` via trusted publishing.
- Keep this fork close to upstream: change public Zen identity/defaults and unsupported Firefox-only surfaces, but preserve upstream internal structure and naming unless Zen requires a behavior change.
