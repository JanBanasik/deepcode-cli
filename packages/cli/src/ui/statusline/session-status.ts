import { execFile } from "node:child_process";
import { promisify } from "node:util";
import stringWidth from "string-width";
import { DEEPSEEK_V4_MODELS, type SessionEntry } from "@vegamo/deepcode-core";
import { formatTokenCount } from "../utils";
import { sanitizeStatusText } from "./sanitize";
import type { StatusSegment } from "./types";
import { theme } from "../theme";

const execFileAsync = promisify(execFile);
export const SESSION_STATUS_SEPARATOR = " · ";

export type SessionStatusInput = {
  model: string;
  contextWindow: number | null;
  session: Pick<SessionEntry, "activeTokens"> | null;
  gitBranch: string | null;
  width: number;
};

export function getStatusContextLimit(
  model: string,
  resolvedLimit: number,
  configuredValues: unknown[]
): number | null {
  const configured = configuredValues.some((value) => {
    if (typeof value === "number") return Number.isSafeInteger(value) && value > 0;
    if (typeof value !== "string") return false;
    // Match the core settings parser; rejected settings must not legitimize its fallback limit.
    const match = value.trim().match(/^(\d+)([km])$/i);
    if (!match) return false;
    const tokens = Number(match[1]) * (match[2]!.toLowerCase() === "m" ? 1024 * 1024 : 1024);
    return Number.isSafeInteger(tokens) && tokens > 0;
  });
  return (configured || DEEPSEEK_V4_MODELS.has(model)) && Number.isFinite(resolvedLimit) && resolvedLimit > 0
    ? resolvedLimit
    : null;
}

export function formatSessionActivity(entry: Pick<SessionEntry, "status" | "failReason">): string {
  return `status: ${entry.status}${entry.failReason ? ` · fail: ${entry.failReason}` : ""}`;
}

function truncateToWidth(text: string, width: number): string {
  if (width <= 0) return "";
  if (stringWidth(text) <= width) return text;
  let result = "";
  for (const char of text) {
    if (stringWidth(result + char) > width - 1) break;
    result += char;
  }
  return result + "…";
}

// activeTokens comes from the last API response (also preserved on resume/fork).
// It is not a live estimate of newly typed prompts or subsequent tool output.
export function formatLastContextUsage(activeTokens: number | undefined, limit: number | null): string {
  if (typeof activeTokens !== "number" || !Number.isFinite(activeTokens) || activeTokens <= 0) {
    return "ctx: n/a";
  }
  if (limit === null || !Number.isFinite(limit) || limit <= 0) {
    return `ctx(last): ${formatTokenCount(activeTokens)} (limit n/a)`;
  }
  const percent = (activeTokens / limit) * 100;
  const percentText = percent < 1 ? "<1" : String(Math.round(percent));
  return `ctx(last): ${formatTokenCount(activeTokens)}/${formatTokenCount(limit)} ${percentText}%`;
}

export function buildSessionStatusSegments(input: SessionStatusInput): StatusSegment[] {
  const width = Math.max(0, Math.floor(input.width));
  if (!width) return [];
  const model = sanitizeStatusText(input.model, 200) || "n/a";
  const candidates: StatusSegment[] = [{ id: "session-model", text: `model: ${model}`, color: theme.primary }];
  if (input.gitBranch) {
    candidates.push({
      id: "session-git",
      text: `git: ${sanitizeStatusText(input.gitBranch, 200)}`,
      color: theme.secondary,
    });
  }
  candidates.push({
    id: "session-context",
    text: formatLastContextUsage(input.session?.activeTokens, input.contextWindow),
    color: theme.muted,
  });

  // Keep the model at every width; add complete fields only when they fit.
  // Reserve room for another field on narrow terminals with long model names.
  const modelWidth = candidates.length > 1 && width >= 40 ? Math.min(width, Math.floor(width * 0.6)) : width;
  const result = [{ ...candidates[0]!, text: truncateToWidth(candidates[0]!.text, modelWidth) }];
  let used = stringWidth(result[0]!.text);
  for (const segment of candidates.slice(1)) {
    const remaining = width - used - stringWidth(SESSION_STATUS_SEPARATOR);
    if (remaining <= 0) break;
    const text = segment.id === "session-git" ? truncateToWidth(segment.text, remaining) : segment.text;
    if (stringWidth(text) > remaining || (segment.id === "session-git" && remaining < 10)) continue;
    result.push({ ...segment, text });
    used += stringWidth(SESSION_STATUS_SEPARATOR) + stringWidth(text);
  }
  return result;
}

export async function readGitBranch(projectRoot: string, signal?: AbortSignal): Promise<string | null> {
  const options = { cwd: projectRoot, timeout: 1500, maxBuffer: 4096, signal, windowsHide: true };
  try {
    const { stdout } = await execFileAsync("git", ["rev-parse", "--abbrev-ref", "HEAD"], options);
    const branch = sanitizeStatusText(stdout, 200);
    if (branch && branch !== "HEAD") return branch;
    const detached = await execFileAsync("git", ["rev-parse", "--short", "HEAD"], options);
    const commit = sanitizeStatusText(detached.stdout, 40);
    return commit ? `detached@${commit}` : null;
  } catch {
    // Unborn branches have a symbolic HEAD but no commit yet.
    if (signal?.aborted) return null;
    try {
      const { stdout } = await execFileAsync("git", ["symbolic-ref", "--quiet", "--short", "HEAD"], options);
      return sanitizeStatusText(stdout, 200) || null;
    } catch {
      return null;
    }
  }
}
