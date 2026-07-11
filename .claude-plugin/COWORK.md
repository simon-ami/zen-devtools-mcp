# Plugin installation for Claude Cowork

## Prerequisites

- **Zen Browser** installed
- **Node.js 20.19.0+** (includes npm) — required to run the MCP server. Download from [nodejs.org](https://nodejs.org).

## Installation Steps

Step by step guide to install the zen-devtools-mcp plugin to Claude Cowork.

At any point, make sure the **Cowork** tab is selected and not the **Chat** tab. Plugins only work with Cowork.

1. Make sure Node.js is installed by running `node --version` in a terminal. The output should show version 20.19.0 or higher. If not, download it from [nodejs.org](https://nodejs.org).

2. Open the **Claude Desktop** application, and select the **Cowork** tab.

3. In the left sidebar, click on the **Customize** button.

4. In the popup which opened, click on the **Plugins** category.

5. In the top-right, click on **Add > Add marketplace**.

6. Paste the URL of this repository (`https://github.com/simon-ami/zen-devtools-mcp`) in the popup, validate.

7. Click on **Sync**.

8. You should now see a new popup called **Directory**, with the list of plugins from the new marketplace.

9. Click on the **+** button and wait for the security prompt (it takes a few seconds), then click **Continue**.

10. Plugin is now ready to use. Close all the popups and try it out in a Cowork task such as "Use Zen to open mozilla.org and rotate the page by 16 degrees".

11. You will have to allow each tool usage when starting a new task, so make sure to click the **Allow** button if appropriate.

## Troubleshooting

Some known issues / limitations.

**Q: Claude says the Zen DevTools tools aren't available, or suggests using a different browser.**

Cowork is often vague about the root cause — it may say things like "the MCP server failed to connect" or "the tools aren't registered", or simply offer to switch to Chrome instead. Check the following:

- Make sure you are in **Claude Cowork**, not in **Claude Chat** — plugins only work in Cowork.
- **Node.js** is missing or outdated. Run `node --version` in a terminal to check. It must be 20.19.0 or higher. If not, download it from [nodejs.org](https://nodejs.org).
- The plugin is not installed. Check that it is listed after clicking on **Customize > Plugins**.

If none of the above helps, [file an issue](https://github.com/simon-ami/zen-devtools-mcp/issues).

**Q: Zen closes after Claude has executed its task.**

The MCP server owns the Zen process it launches and closes it when the server session ends. Use a persistent dedicated profile to preserve state between sessions.

**Q: Zen is not using my profile, I don't have my bookmarks, cookies, etc.**

Exposing a personal profile to automation is risky. By default the MCP uses a persistent dedicated profile under `~/.zen-devtools-mcp`, separate from your regular Zen profile.
