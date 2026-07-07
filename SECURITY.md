# Security

Browser MCP servers can expose whatever the controlled browser can access. Treat a connected Zen session as sensitive.

## Profile Safety

Use the default dedicated MCP profile under `~/.zen-devtools-mcp`. Do not point the server directly at your regular Zen profile. If `--profile-path` points at a real Gecko profile, the server creates `zen_devtools_mcp_profile` inside it instead of using the real profile directly.

## Risky Flags

`--enable-script` allows arbitrary JavaScript evaluation in page contexts.

`--enable-privileged-context` exposes privileged Gecko contexts and requires `MOZ_REMOTE_ALLOW_SYSTEM_ACCESS=1`. Use it only in isolated environments.

`--connect-existing` attaches to a running Zen instance. If that instance uses your real profile, the agent can access cookies, active sessions, browsing history, and saved site state.

`--accept-insecure-certs` disables TLS certificate validation for automated browsing.

## Reporting

This is a personal fork. Report security problems through the repository issue tracker or directly to the maintainer.
