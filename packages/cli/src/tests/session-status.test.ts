import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import stringWidth from "string-width";
import {
  buildSessionStatusSegments,
  formatLastContextUsage,
  formatSessionActivity,
  getStatusContextLimit,
  readGitBranch,
  SESSION_STATUS_SEPARATOR,
} from "../ui/statusline/session-status";

test("context reports the last authoritative usage, preserves over-limit values, and marks missing data", () => {
  assert.equal(formatLastContextUsage(2048, 8192), "ctx(last): 2K/8K 25%");
  assert.equal(formatLastContextUsage(1, 8192), "ctx(last): 1/8K <1%");
  assert.equal(formatLastContextUsage(10_240, 8192), "ctx(last): 10K/8K 125%");
  for (const tokens of [undefined, 0, -1, NaN, Infinity]) {
    assert.equal(formatLastContextUsage(tokens, 8192), "ctx: n/a");
  }
  for (const limit of [null, 0, -1, NaN, Infinity]) {
    assert.equal(formatLastContextUsage(2048, limit), "ctx(last): 2K (limit n/a)");
  }
});

test("generic model defaults are not treated as authoritative context limits", () => {
  assert.equal(getStatusContextLimit("custom-model", 131072, []), null);
  assert.equal(getStatusContextLimit("custom-model", 8192, [8192]), 8192);
  assert.equal(getStatusContextLimit("custom-model", 8192, ["8k"]), 8192);
  assert.equal(getStatusContextLimit("deepseek-flash", 1048576, []), 1048576);
  for (const invalid of [0, -1, 1.5, Infinity, "8192", "1.5k", "1 k", "0k", "9999999999999999999m"]) {
    assert.equal(getStatusContextLimit("custom-model", 131072, [invalid]), null);
  }
});

test("status handles Unicode, long names, missing fields, and narrow terminals on one line", () => {
  for (const width of [1, 10, 25, 40, 80, 120]) {
    for (const model of ["deepseek-flash", "very-long-model-".repeat(10), "模型👋".repeat(20)]) {
      const segments = buildSessionStatusSegments({
        width,
        model,
        contextWindow: 8192,
        session: { activeTokens: 2048 },
        gitBranch: "feature/模型👋".repeat(20),
      });
      const text = segments.map((segment) => segment.text).join(SESSION_STATUS_SEPARATOR);
      assert.ok(stringWidth(text) <= width, `${width}: ${text}`);
      assert.ok(!text.includes("\n"));
      assert.equal(segments[0]?.id, "session-model");
      assert.doesNotMatch(text, /cost|\$/i);
    }
  }
  const empty = buildSessionStatusSegments({
    width: 120,
    model: "",
    contextWindow: null,
    session: null,
    gitBranch: null,
  });
  assert.deepEqual(
    empty.map((segment) => segment.text),
    ["model: n/a", "ctx: n/a"]
  );
  assert.deepEqual(
    buildSessionStatusSegments({ width: 0, model: "x", contextWindow: null, session: null, gitBranch: null }),
    []
  );
});

test("activity keeps permission, interruption, and failure information without duplicating accounting", () => {
  assert.equal(formatSessionActivity({ status: "ask_permission", failReason: null }), "status: ask_permission");
  assert.equal(
    formatSessionActivity({ status: "failed", failReason: "bad request" }),
    "status: failed · fail: bad request"
  );
  assert.equal(formatSessionActivity({ status: "interrupted", failReason: null }), "status: interrupted");
});

test("Git status reads normal, unborn, detached, non-Git, and cancelled states asynchronously", async () => {
  const root = mkdtempSync(join(tmpdir(), "jcode-git-status-"));
  const git = (...args: string[]) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
  try {
    assert.equal(await readGitBranch(root), null);
    git("init", "--initial-branch=fixture-main");
    assert.equal(await readGitBranch(root), "fixture-main");
    git(
      "-c",
      "user.name=Fixture",
      "-c",
      "user.email=fixture@example.invalid",
      "commit",
      "--allow-empty",
      "-m",
      "fixture"
    );
    assert.equal(await readGitBranch(root), "fixture-main");
    const sha = git("rev-parse", "--short", "HEAD");
    git("checkout", "--detach");
    assert.equal(await readGitBranch(root), `detached@${sha}`);
    const controller = new AbortController();
    controller.abort();
    assert.equal(await readGitBranch(root, controller.signal), null);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
