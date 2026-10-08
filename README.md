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

![JCode at 120 columns](resources/jcode-120.png)

[80 columns](resources/jcode-80.png) · [40 columns](resources/jcode-40.png) · [No color](resources/jcode-no-color.png) · [Model menu](resources/jcode-model-menu.png) · [Permission prompt](resources/jcode-permission.png) · [Tool output and context usage](resources/jcode-status.png)

## Attribution

Based on [upstream Deep Code](https://github.com/lessweb/deepcode-cli). The original MIT license and copyright notices are retained in [LICENSE](LICENSE). The SPECTRE octopus is a James Bond emblem; the terminal rendition follows the [reference reproduced by DPMA](https://www.dpma.de/dpma/veroeffentlichungen/hintergrund/dasallalles/jamesbond/index.html). JCode is an independent personal fork.

The original Chinese usage documentation follows. [English usage documentation](README-en.md).

## 配置

创建 `~/.deepcode/settings.json` 文件，内容如下：

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

配置文件与[上游 Deep Code VSCode 插件](https://github.com/lessweb/deepcode-cli)共享，无需重复配置。

完整配置说明（多层级优先级、环境变量等）请参阅 [docs/configuration.md](docs/configuration.md)。

## 主要功能

### **Skills**
JCode 支持 agent skills，允许您扩展助手的能力：

Skills 会按以下优先级扫描：

| Scope   | Path                  | Purpose                       |
| :------ | :-------------------- | :---------------------------- |
| Project | `./.deepcode/skills/` | JCode 兼容位置            |
| Project | `./.agents/skills/`   | 跨客户端互操作                |
| User    | `~/.deepcode/skills/` | JCode 兼容位置            |
| User    | `~/.agents/skills/`   | 跨客户端互操作                |

### **为 DeepSeek 优化**
- 专门为 DeepSeek 模型性能调优。
- 通过使用[上下文缓存](https://api-docs.deepseek.com/guides/kv_cache)来降低成本。
- 原生支持[思考模式](https://api-docs.deepseek.com/guides/thinking_mode)和思考强度控制。

## 斜杠命令与按键功能

| 斜杠命令        | 操作                               |
|-------------|----------------------------------|
| `/`         | 打开 skills / 命令菜单                 |
| `/new`      | 开始新对话                            |
| `/resume`   | 选择历史对话继续                         |
| `/fork`     | 从当前对话创建独立的新会话                    |
| `/continue` | 继续当前对话，或选择历史对话恢复                 |
| `/model`    | 切换模型、思考模式和推理强度                   |
| `/raw`      | 切换显示模式（Normal / Lite / Raw 滚动回溯） |
| `/init`     | 初始化 AGENTS.md 文件                 |
| `/skills`   | 列出可用 skills                      |
| `/mcp`      | 查看 MCP 服务器状态和可用工具                |
| `/undo`     | 将代码和/或对话恢复到之前的状态                 |
| `/exit`     | 退出（也可用连续 `Ctrl+D`）               |

| 按键            | 操作                 |
|---------------|--------------------|
| `Enter`       | 发送消息               |
| `Shift+Enter` | 插入换行（也可用 `Ctrl+J`） |
| `Ctrl+V`      | 从剪贴板粘贴图片           |
| `Esc`         | 中断当前模型回复           |
| 连续 `Ctrl+D`   | 退出                 |

### 提示词队列

助手工作时，按 `Enter` 可将后续提示词加入队列。当前轮次结束后，队列中的提示词会按提交顺序逐一执行。输入框仍可编辑，光标保持可见；队列会显示待处理数量，以及最多三条带编号的单行预览。仅包含图片或 skills 的提示词也会显示对应说明。

按 `Esc` 会中断当前轮次并清空所有尚未执行的提示词。在 `Esc` 后主动提交的新提示词会等待被中断的任务结束，然后执行。忙碌时斜杠命令仍不可用，但 `/exit` 会立即退出并清空队列。待处理提示词仅保存在当前 CLI 进程的内存中。

![使用示例提示词渲染的 CLI 队列预览](resources/prompt-queue.png)

## 支持的模型

- `deepseek-flash`（推荐使用）
- `deepseek-v4-pro`
- `deepseek-v4-flash`
- `deepseek-v4-flash-vision-exp`
- 任何其他 OpenAI 兼容模型

## 架构和基准测试

Armin Ronacher 在[《Better Models: Worse Tools》](https://lucumr.pocoo.org/2026/7/4/better-models-worse-tools/)中指出，工具 schema 不是「中立的」：模型（LLM）会继承训练和强化学习中形成的工具使用习惯，因此可能在某个主流 harness 中表现很好，却在另一套工具形态下变得不稳定。这正是 JCode 的架构出发点：只为 DeepSeek 量身调优，从而让 harness 本身持续贴合 DeepSeek 的行为特点。

上游 Deep Code 的收益来自于工具约束、上下文管理、Agent Skills 和权限策略等多项设计叠加后的结果。[deepcode-qrcode-benchmark](https://github.com/qorzj/deepcode-qrcode-benchmark) 项目展示了在一个真实且有难度的 Python 需求上，Deep Code + DeepSeek + `/plan` 模式相较 Claude Code + DeepSeek 的组合具有效果优势。

> 详见：[JCode 架构](docs/architecture.md)

## 常见问题

### JCode 是否支持子代理？

JCode 尚不支持原生子代理的启动和管理。Agent Skills 提供可复用的指令，MCP 连接外部工具，`/fork` 创建会话分支。后台 Bash 任务是 Shell 进程；内置工具调用目前按顺序执行。原生子代理功能记录在 [issue #9](https://github.com/JanBanasik/deepcode-cli/issues/9)。

### JCode 是否有 VSCode 配套插件？

本仓库包含 JCode VSCode 配套插件，并兼容已发布的[上游 Deep Code 插件](https://marketplace.visualstudio.com/items?itemName=vegamo.deepcode-vscode)。它们与 CLI 共享 `~/.deepcode/settings.json` 配置。JCode 尚未单独发布到 Marketplace。

### JCode 是否支持理解图片？

支持。`deepseek-flash` 模型支持直接读取本地图片或使用`ctrl+v`从剪贴板粘贴图片，让模型直接看到图片内容。

`deepseek-v4-pro`、`deepseek-v4-flash` 等非多模态模型仍会使用 `UnderstandImage` 识图工具。JCode 会自动判断模型能力，也可通过 `multimodal` 配置项手动覆盖。

默认情况下，图片会以 base64 内联发送给模型。启用 `filesApiEnabled` 后，JCode 会使用 DeepSeek Files API 上传图片并在请求中复用 `file_id`。详见 [docs/configuration.md](docs/configuration.md#deepseek-files-api)。

### 怎样在任务完成后自动给 Slack 发消息？

编写一个调用 Slack webhook 的 Shell 通知脚本，然后在 `~/.deepcode/settings.json` 中将 `notify` 字段设为该脚本的完整路径即可。详细步骤请参考 [docs/notify.md](docs/notify.md)。

### 怎样启用联网搜索功能？

JCode自带免费的、且大部分情况够用的Web Search工具。如果你希望使用自定义脚本进行联网搜索，可以在 `~/.deepcode/settings.json` 中将 `webSearchTool` 设为脚本的完整路径即可。详细步骤可参考：https://github.com/qorzj/web_search_cli

### 如何配置 MCP？

JCode 支持 MCP（Model Context Protocol），可以连接 GitHub、浏览器、数据库等外部服务。在 `settings.json` 中配置 `mcpServers` 字段即可启用，启动后使用 `/mcp` 命令查看已配置的 MCP 服务器状态和可用工具。

详细配置指南：[docs/mcp.md](docs/mcp.md)

### 如何配置 JCode 任务完成后发送通知？

当 AI 助手完成一轮任务后，JCode 可以自动执行一个通知脚本，将任务结果发送到你指定的渠道（如 Slack、系统通知等）。

详细配置指南：[docs/notify.md](docs/notify.md)

### JCode 只支持 YOLO 模式吗？

不是。JCode 内置了细粒度的权限控制机制，支持在 AI 助手执行 Shell 命令、读写文件、访问网络等操作前进行确认。你可以通过 `settings.json` 中的 `permissions` 字段按需配置每种权限范围的策略：始终允许、始终询问、或直接拒绝。详见 [docs/permission.md](docs/permission.md)。

### 是否支持 Coding Plan？

支持。只要把 `~/.deepcode/settings.json` 的 `env.BASE_URL` 配置为 OpenAI 兼容的接口地址就行。以火山方舟的 Coding Plan 为例：

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

## 贡献

欢迎贡献代码！以下是参与方式：

```bash
# 克隆仓库
git clone https://github.com/JanBanasik/deepcode-cli.git JCode
cd JCode

# 安装依赖
npm ci

# 运行测试
npm test

# CLI本地开发（类型检查 + lint + 格式检查 + 构建）
npm run build

# Install JCode separately from upstream
npm install --global --prefix "$HOME/.local/share/jcode" ./packages/cli --ignore-scripts
export PATH="$HOME/.local/share/jcode/bin:$PATH"

# VSCode插件本地开发
npm run build:vscode

```

- 提交 PR 前请确保 `npm run check` 通过（类型检查 + lint + 格式检查）
- 建议在执行构建前，先执行 `npm run format` 自动格式化代码，避免构建报错

## 获取帮助

- 在 GitHub Issues 上报告错误或请求功能 (https://github.com/JanBanasik/deepcode-cli/issues)

## 协议

- MIT

## 支持我们

如果你觉得这个工具对你有帮助，请考虑通过以下方式支持我们：

- 在 GitHub 上给我们一个 Star (https://github.com/JanBanasik/deepcode-cli)
- 向我们提交反馈和建议
- 分享给你的朋友和同事
