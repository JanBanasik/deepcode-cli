import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { stripVTControlCharacters } from "node:util";
import { test } from "node:test";
import React from "react";
import { Box, renderToString } from "ink";
import stringWidth from "string-width";
import { resolveSettingsSources } from "@vegamo/deepcode-core";
import { WelcomeScreen } from "../ui/views/WelcomeScreen";
import { SessionStatus } from "../ui/components/session-status";

test("welcome and session status stay within 40, 80, and 120 columns", () => {
  const settings = resolveSettingsSources(
    null,
    null,
    { model: "deepseek-flash", baseURL: "https://api.deepseek.com" },
    {}
  );
  for (const width of [20, 32, 40, 80, 120]) {
    const output = stripVTControlCharacters(
      renderToString(
        React.createElement(
          Box,
          { flexDirection: "column", width },
          React.createElement(WelcomeScreen, {
            width,
            settings,
            skills: [],
            projectRoot: "/tmp/a-long-project-directory",
          }),
          React.createElement(SessionStatus, {
            width,
            model: settings.model,
            contextWindow: settings.contextWindow,
            session: null,
            gitBranch: "fixture-main",
          })
        ),
        { columns: width }
      )
    );
    assert.match(output, /JCode/);
    assert.match(output, /model:/);
    for (const line of output.split("\n")) {
      assert.ok(stringWidth(line) <= width, `${width}: ${line}`);
    }
  }
});

test("NO_COLOR overrides forced colors in welcome, status, raw text, and gradients", () => {
  const cliRoot = fileURLToPath(new URL("../../../../", import.meta.url));
  const script = `
    import React from "react";
    import { renderToString, Box } from "ink";
    import { resolveSettingsSources } from "@vegamo/deepcode-core";
    import { WelcomeScreen } from "./packages/cli/src/ui/views/WelcomeScreen.tsx";
    import { SessionStatus } from "./packages/cli/src/ui/components/session-status.tsx";
    import { renderMarkdown } from "./packages/cli/src/ui/components/MessageView/markdown.ts";
    import { buildExitSummaryText } from "./packages/cli/src/ui/exit-summary.ts";
    const settings = resolveSettingsSources(null, null, { model: "deepseek-flash", baseURL: "https://api.deepseek.com" }, {});
    console.log(renderToString(React.createElement(Box, { flexDirection: "column" },
      React.createElement(WelcomeScreen, { width: 80, settings, skills: [], projectRoot: "/tmp/fixture" }),
      React.createElement(SessionStatus, { width: 80, model: settings.model, contextWindow: 8192, session: {activeTokens: 2048}, gitBranch: "fixture-main" })
    ), {columns:80}));
    console.log(renderMarkdown("# Heading"));
    console.log(buildExitSummaryText({session:null}));
  `;
  const result = spawnSync(process.execPath, ["--import", "tsx", "--input-type=module", "-e", script], {
    cwd: cliRoot,
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1", FORCE_COLOR: "3" },
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /JCode/);
  assert.match(result.stdout, /ctx\(last\): 2K\/8K 25%/);
  assert.doesNotMatch(result.stdout, /\x1b\[(?:38|48|3[0-7]|4[0-7]|9[0-7]|10[0-7])(?:;|m)/);
});
