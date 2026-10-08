import { theme } from "../ui/theme";
import { test } from "node:test";
import assert from "node:assert/strict";
import { getScopeRiskColor } from "../ui/views/PermissionPrompt";

test("getScopeRiskColor maps permission scopes by risk", () => {
  assert.equal(getScopeRiskColor("read-in-cwd"), theme.success);
  assert.equal(getScopeRiskColor("read-in-tmp"), theme.success);
  assert.equal(getScopeRiskColor("write-in-tmp"), theme.success);
  assert.equal(getScopeRiskColor("query-git-log"), theme.success);

  assert.equal(getScopeRiskColor("read-out-cwd"), theme.warning);
  assert.equal(getScopeRiskColor("write-in-cwd"), theme.warning);
  assert.equal(getScopeRiskColor("network"), theme.warning);
  assert.equal(getScopeRiskColor("mcp"), theme.warning);

  assert.equal(getScopeRiskColor("write-out-cwd"), theme.error);
  assert.equal(getScopeRiskColor("delete-in-cwd"), theme.error);
  assert.equal(getScopeRiskColor("delete-out-cwd"), theme.error);
  assert.equal(getScopeRiskColor("mutate-git-log"), theme.error);
  assert.equal(getScopeRiskColor("unknown"), theme.error);
});
