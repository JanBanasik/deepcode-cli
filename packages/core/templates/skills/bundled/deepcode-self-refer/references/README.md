# JCode

A personal fork of [Deep Code CLI](https://github.com/lessweb/deepcode-cli), with a SPECTRE terminal emblem, violet/cyan accents, and a compact session footer. DeepSeek configuration, native skills, permissions, and the existing prompt queue are preserved.

## Local installation

Requires Node.js 22 or newer and npm. From this checkout:

```bash
npm ci
npm run check
npm test
npm run build
npm install --global --prefix "$HOME/.local/share/jcode" ./packages/cli --ignore-scripts
export PATH="$HOME/.local/share/jcode/bin:$PATH"
jcode --version
jcode --help
```

Run `jcode` from any project directory. Add the `export PATH` line to your shell configuration if you want it available in future terminals. Rebuild after source changes; the local installation points to this checkout. To run without installing, use `npm start -- --help` or `node packages/cli/dist/cli.js` from this checkout.

The separate install prefix exposes only `jcode` and lets an existing global `deepcode` installation remain available. Internal workspace package names stay unchanged, so use the dedicated prefix above. The CLI package is marked `private` and remains unpublished; it does not offer npm updates from the upstream release channel.

## Shared settings and sessions

JCode continues to use `~/.deepcode/settings.json`, project `.deepcode/settings.json`, `~/.deepcode/projects/`, and existing skill directories. Settings and sessions are shared with upstream JCode and its VSCode companion; model changes and session edits made in either CLI are visible to the other. There is no migration or API-key change. Internal workspace packages, VSCode command IDs, and the `deepcode-self-refer` skill identifier retain their upstream names to preserve imports and existing settings. Existing `env.API_KEY`, `env.BASE_URL`, `DEEPCODE_*` environment overrides, model, and permission configuration still apply.

## Appearance and session footer

The terminal background and default foreground are preserved. Semantic colors are centralized in `packages/cli/src/ui/theme.ts`: violet (`#A78BFA`) for the main accent, cyan (`#22D3EE`) for secondary accents/selection, and separate success, warning, error, border, and muted tokens. `NO_COLOR=1 jcode`, `FORCE_COLOR=0 jcode`, and `TERM=dumb` disable colors; selection markers and permission descriptions remain readable.

The footer always prioritizes the selected model and shows the Git branch inside a repository, including an unborn branch or `detached@<commit>`. Git refreshes asynchronously every 10 seconds and when a turn starts/finishes. Long fields are shortened and lower-priority fields omitted at narrow widths; existing custom status providers remain supported.

`ctx(last)` uses the session's last API-reported token count and the configured context limit resolved by core. It is a snapshot, not an estimate of unsent prompts or newly appended tool output. Before reported usage exists it reads `ctx: n/a`. For custom models without an explicit valid `contextWindow`/`DEEPCODE_CONTEXT_WINDOW`, the generic core fallback is not presented as a known limit. Token abbreviations retain upstream's binary K/M units. Session cost is hidden because this checkout has no trustworthy pricing data.

Terminal captures of the built CLI (the status/tool capture uses a local fixture endpoint, with no paid calls):

![JCode at 120 columns](https://raw.githubusercontent.com/JanBanasik/deepcode-cli/main/resources/jcode-120.png)

[80 columns](https://raw.githubusercontent.com/JanBanasik/deepcode-cli/main/resources/jcode-80.png) · [40 columns](https://raw.githubusercontent.com/JanBanasik/deepcode-cli/main/resources/jcode-40.png) · [No color](https://raw.githubusercontent.com/JanBanasik/deepcode-cli/main/resources/jcode-no-color.png) · [Model menu](https://raw.githubusercontent.com/JanBanasik/deepcode-cli/main/resources/jcode-model-menu.png) · [Permission prompt](https://raw.githubusercontent.com/JanBanasik/deepcode-cli/main/resources/jcode-permission.png) · [Tool output and context usage](https://raw.githubusercontent.com/JanBanasik/deepcode-cli/main/resources/jcode-status.png)

## Attribution

Based on [upstream Deep Code](https://github.com/lessweb/deepcode-cli). The original MIT license and copyright notices are retained in [LICENSE](https://github.com/JanBanasik/deepcode-cli/blob/main/LICENSE). The SPECTRE octopus is a James Bond emblem; the terminal rendition follows the [reference reproduced by DPMA](https://www.dpma.de/dpma/veroeffentlichungen/hintergrund/dasallalles/jamesbond/index.html). JCode is an independent personal fork.

## Configuration

Create `~/.deepcode/settings.json`:

```json
{
  "env": {
    "MODEL": "deepseek-flash",
    "BASE_URL": "https://api.deepseek.com",
    "API_KEY": "sk-..."
  },
  "thinkingEnabled": true,
  "reasoningEffort": "max"
}
```

The configuration file is shared with the [upstream Deep Code VSCode extension](https://github.com/lessweb/deepcode-cli) — configure once, use everywhere.

For complete configuration details (multi-level priority, environment variables, etc.), see [docs/configuration.md](configuration.md).

## Key Features

### **Skills**
JCode supports agent skills that allow you to extend the assistant's capabilities:

Skills are discovered from these locations, in priority order:

| Scope   | Path                  | Purpose                       |
| :------ | :-------------------- | :---------------------------- |
| Project | `./.deepcode/skills/` | Shared legacy location   |
| Project | `./.agents/skills/`   | Cross-client interoperability |
| User    | `~/.deepcode/skills/` | Shared legacy location   |
| User    | `~/.agents/skills/`   | Cross-client interoperability |

### **Optimized for DeepSeek**
- Specifically tuned for DeepSeek model performance.
- Reduce costs by using [Context Caching](https://api-docs.deepseek.com/guides/kv_cache).
- Natively supports [Thinking Mode](https://api-docs.deepseek.com/guides/thinking_mode) and Effort Control.

## Slash Commands & Keyboard Shortcuts

| Slash Command    | Action                                                  |
|------------------|---------------------------------------------------------|
| `/`              | Open the skills / commands menu                         |
| `/new`           | Start a fresh conversation                              |
| `/resume`        | Choose a previous conversation to continue              |
| `/fork`          | Fork the current conversation     |
| `/continue`      | Continue the active conversation or pick one to resume  |
| `/model`         | Switch model, thinking mode, and reasoning effort       |
| `/raw`           | Toggle display mode (Normal / Lite / Raw scrollback)    |
| `/init`          | Initialize an AGENTS.md file (LLM project instructions) |
| `/skills`        | List available skills                                   |
| `/mcp`           | View MCP server status and available tools              |
| `/undo`          | Restore code and/or conversation to a previous point    |
| `/exit`          | Quit (also `Ctrl+D` twice)                              |

| Key              | Action                                                   |
|------------------|----------------------------------------------------------|
| `Enter`          | Send the prompt                                          |
| `Shift+Enter`    | Insert a newline (also `Ctrl+J`)                         |
| `Ctrl+V`         | Paste an image from the clipboard                        |
| `Esc`            | Interrupt the current model turn                         |
| `Ctrl+D` twice   | Quit JCode                                           |

### Queued prompts

While the assistant is working, press `Enter` to queue a follow-up prompt. Prompts run one at a time in submission order, after the active turn finishes. The input stays editable with a visible cursor, and the queue shows its count plus up to three numbered, one-line previews. Image-only and skill-only prompts also have descriptive previews.

Press `Esc` to interrupt the active turn and discard every waiting prompt. A new prompt intentionally submitted after `Esc` waits for the interrupted run to settle and then executes. Slash commands remain blocked while busy, except `/exit`, which exits immediately and discards the queue. Pending prompts are kept in memory for the current CLI instance.

![Queued prompt previews in the CLI, rendered with sample prompts](https://raw.githubusercontent.com/JanBanasik/deepcode-cli/main/resources/prompt-queue.png)

## Supported Models

- `deepseek-flash` (Recommended)
- `deepseek-v4-pro`
- `deepseek-v4-flash`
- `deepseek-v4-flash-vision-exp`
- Any other OpenAI-compatible model

## Architecture and Benchmarks

In ["Better Models: Worse Tools"](https://lucumr.pocoo.org/2026/7/4/better-models-worse-tools/), Armin Ronacher argues that tool schemas are not "neutral": models (LLMs) inherit tool-use habits formed during training and reinforcement learning, so they may perform well in one mainstream harness but become unstable with a different tool shape. This is the architectural starting point for JCode: it is tuned specifically for DeepSeek, so the harness itself can stay aligned with DeepSeek's behavior.

Upstream Deep Code's gains come from the combined effect of tool constraints, context management, Agent Skills, permission policy, and other architectural decisions. The [deepcode-qrcode-benchmark](https://github.com/qorzj/deepcode-qrcode-benchmark) project shows that on a real and challenging Python requirement, Deep Code + DeepSeek + `/plan` mode has an effectiveness advantage over Claude Code + DeepSeek.

> See also: [JCode Architecture](https://github.com/JanBanasik/deepcode-cli/blob/main/docs/architecture_en.md)

## FAQ

### Does JCode support subagents?

JCode does not yet launch or supervise native subagents. Agent Skills provide reusable instructions, MCP connects external tools, and `/fork` branches a conversation. Background Bash jobs are shell processes; built-in tool calls currently run sequentially. Native subagent support is tracked in [issue #9](https://github.com/JanBanasik/deepcode-cli/issues/9).

### Does JCode have a VSCode companion?

This checkout includes the JCode VSCode companion. It also remains compatible with the published [upstream Deep Code extension](https://marketplace.visualstudio.com/items?itemName=vegamo.deepcode-vscode). Both share `~/.deepcode/settings.json` with the CLI. JCode has no separate Marketplace release.

### Does JCode support understanding images?

Yes. The `deepseek-flash` model can read local images directly, or you can paste images from the clipboard with `Ctrl+V`, so the model can see the image content directly.

Non-multimodal models such as `deepseek-v4-pro` and `deepseek-v4-flash` continue to use the `UnderstandImage` image-understanding tool. JCode detects model capabilities automatically; you can also override the detection with the `multimodal` setting.

By default, images are sent inline as base64. With `filesApiEnabled`, JCode uploads images through the DeepSeek Files API and reuses the `file_id` in subsequent requests. See [docs/configuration_en.md](configuration_en.md#deepseek-files-api).

### How to automatically send a Slack message after a task completes?

Write a shell notification script that calls a Slack webhook, then set the `notify` field in `~/.deepcode/settings.json` to the full path of the script. For detailed steps, see [docs/notify_en.md](notify_en.md).

### How do I enable web search?

JCode comes with a built-in, free Web Search tool that works well for most use cases. If you prefer to use a custom script for web search, set the `webSearchTool` field in `~/.deepcode/settings.json` to the full path of your script. For detailed steps, refer to: https://github.com/qorzj/web_search_cli

### Does it support Coding Plan?

Yes. Just set `env.BASE_URL` in `~/.deepcode/settings.json` to an OpenAI-compatible API endpoint. Take Volcano Ark's Coding Plan as an example:

```json
{
  "env": {
    "MODEL": "ark-code-latest",
    "BASE_URL": "https://ark.cn-beijing.volces.com/api/coding/v3",
    "API_KEY": "**************"
  },
  "thinkingEnabled": true
}
```

### How do I configure MCP?

JCode supports MCP (Model Context Protocol) to connect external services such as GitHub, browsers, databases, and more. Configure the `mcpServers` field in `settings.json` to enable it, then use the `/mcp` command to view MCP server status and available tools.

For detailed setup instructions, see: [docs/mcp.md](mcp.md)

### How to configure JCode to send notifications after a task completes?

When the AI assistant completes a task, JCode can automatically execute a notification script to send the task results to the specified channel (e.g., Slack, system notifications, etc.).

For detailed configuration instructions, see: [docs/notify_en.md](notify_en.md)

### Does JCode only support YOLO mode?

No. JCode has a built-in fine-grained permission control mechanism that lets you confirm operations before the AI assistant executes shell commands, reads/writes files, accesses the network, and more. You can configure each permission scope's policy — always allow, always ask, or deny — via the `permissions` field in `settings.json`. See [docs/permission.md](permission.md) for details.

## Contributing

Contributions are welcome! Here's how to get started:

```bash
# Clone the repository
git clone https://github.com/JanBanasik/deepcode-cli.git JCode
cd JCode

# Install dependencies
npm ci

# Local development (typecheck + lint + format check + bundle)
npm run build

# Run tests
npm test

# Install the fork separately from upstream
npm install --global --prefix "$HOME/.local/share/jcode" ./packages/cli --ignore-scripts
export PATH="$HOME/.local/share/jcode/bin:$PATH"
```

- Make sure `npm run check` passes before submitting a PR (typecheck + lint + format check)
- We recommend running `npm run format` before building to avoid errors

## Getting Help

- Report bugs or request features on GitHub Issues (https://github.com/JanBanasik/deepcode-cli/issues)

## License

- MIT

## Support Us

If you find this tool helpful, please consider supporting us by:

- Giving us a Star on GitHub (https://github.com/JanBanasik/deepcode-cli)
- Submitting feedback and suggestions
- Sharing with your friends and colleagues
