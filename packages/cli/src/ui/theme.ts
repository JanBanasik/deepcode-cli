import baseChalk, { Chalk } from "chalk";

export type ThemeToken =
  | "primary"
  | "secondary"
  | "text"
  | "muted"
  | "success"
  | "warning"
  | "error"
  | "border"
  | "selection";

// Leave foreground/background defaults to the terminal where possible.
const palette: Record<ThemeToken, string | undefined> = {
  primary: "#A78BFA",
  secondary: "#22D3EE",
  text: undefined,
  muted: "#94A3B8",
  success: "#4ADE80",
  warning: "#FBBF24",
  error: "#F87171",
  border: "#64748B",
  selection: "#22D3EE",
};

export const colorsDisabled =
  process.env.NO_COLOR !== undefined || process.env.FORCE_COLOR === "0" || process.env.TERM === "dumb";

export const theme: Readonly<Record<ThemeToken, string | undefined>> = Object.fromEntries(
  Object.entries(palette).map(([token, color]) => [token, colorsDisabled ? undefined : color])
) as Record<ThemeToken, string | undefined>;

// Use the same disable rules for raw/markdown output as for Ink components.
export const chalk = new Chalk({ level: colorsDisabled ? 0 : baseChalk.level });
export const themeText = Object.fromEntries(
  Object.entries(palette).map(([token, color]) => [token, color ? chalk.hex(color) : chalk])
) as Record<ThemeToken, typeof chalk>;

export function terminalColor(color: string | undefined): string | undefined {
  return colorsDisabled ? undefined : color;
}
