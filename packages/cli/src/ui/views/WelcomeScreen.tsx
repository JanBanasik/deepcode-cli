import { theme } from "../theme";
import React, { useMemo, useState } from "react";
import { Box, Text } from "ink";
import * as os from "node:os";
import path from "node:path";
import type { SkillInfo } from "@vegamo/deepcode-core";
import type { ResolvedDeepcodingSettings } from "@vegamo/deepcode-core";
import { buildSlashCommands, BUILTIN_SLASH_COMMANDS, formatSlashCommandDescription } from "../core/slash-commands";
import { ThemedGradient } from "./ThemedGradient";
import { AsciiLogo, CompactAsciiLogo } from "../ascii-art";
import { useAppContext } from "../contexts";

type WelcomeScreenProps = {
  projectRoot: string;
  settings: ResolvedDeepcodingSettings;
  skills: SkillInfo[];
  width: number;
};

const SHORTCUT_TIPS = [
  { label: "Enter", description: "Send the prompt" },
  { label: "Shift+Enter", description: "Insert a newline" },
  { label: "Ctrl+V", description: "Paste an image from the clipboard" },
  { label: "Ctrl+R", description: "Open raw display mode selection" },
  { label: "Esc", description: "Interrupt the current model turn" },
  { label: "/", description: "Open the skills and commands menu" },
  { label: "Ctrl+D twice", description: "Quit JCode" },
];

export function WelcomeScreen({ projectRoot, settings, skills, width }: WelcomeScreenProps): React.ReactElement {
  const { version } = useAppContext();
  const tips = useMemo(() => buildWelcomeTips(skills), [skills]);
  const [tipIndex] = useState(() => randomTipIndex(tips.length));
  const compact = width < 76;
  const cwd = formatHomeRelativePath(projectRoot);
  const tip = tips[Math.min(tipIndex, Math.max(0, tips.length - 1))] ?? tips[0];
  const panelWidth = Math.max(1, Math.min(width, 100));

  return (
    <Box flexDirection="column" marginY={1} width={panelWidth}>
      <Box flexDirection={compact ? "column" : "row"} gap={1}>
        {width >= 25 ? (
          <Box width={compact ? panelWidth : 33} justifyContent="center" alignItems="center">
            <ThemedGradient>{compact ? CompactAsciiLogo : AsciiLogo}</ThemedGradient>
          </Box>
        ) : null}
        <Box
          borderStyle="round"
          borderColor={theme.border}
          flexDirection="column"
          flexGrow={1}
          flexShrink={1}
          paddingX={1}
          justifyContent="center"
        >
          <Text bold color={theme.primary}>
            JCode <Text color={theme.muted}>v{version || "unknown"}</Text>
          </Text>
          <Text color={theme.muted}>A personal fork of Deep Code</Text>
          <Box marginTop={1} flexDirection="column">
            <SettingRow label="Model" value={settings.model} width={width} />
            <SettingRow
              label="Thinking"
              value={settings.thinkingEnabled ? settings.reasoningEffort : "off"}
              width={width}
            />
            <SettingRow label="CWD" value={cwd} width={width} />
          </Box>
        </Box>
      </Box>
      {tip ? (
        <Box marginTop={1}>
          <Text color={theme.muted} wrap="truncate-end">
            Tips: {tip.label} - {tip.description}
          </Text>
        </Box>
      ) : null}
    </Box>
  );
}

function SettingRow({ label, value, width }: { label: string; value: string; width: number }): React.ReactElement {
  return (
    <Box flexDirection={width < 35 ? "column" : "row"}>
      <Box width={width < 35 ? undefined : 10} flexShrink={0}>
        <Text color={theme.muted}>{label}</Text>
      </Box>
      <Box flexGrow={1} flexShrink={1}>
        <Text color={theme.secondary} wrap="truncate-end">
          {value}
        </Text>
      </Box>
    </Box>
  );
}

export function formatHomeRelativePath(value: string, home = os.homedir()): string {
  const normalizedValue = path.resolve(value);
  const normalizedHome = path.resolve(home);
  const relative = path.relative(normalizedHome, normalizedValue);

  if (relative === "") {
    return "~";
  }
  if (!relative.startsWith("..") && !path.isAbsolute(relative)) {
    return `~${path.sep}${relative}`;
  }
  return normalizedValue;
}

export function buildWelcomeTips(skills: SkillInfo[]): Array<{ label: string; description: string }> {
  const slashTips = buildSlashCommands(skills)
    .filter((item) => item.kind !== "skill" || item.skill?.isLoaded)
    .map((item) => ({
      label: item.label,
      description: formatSlashCommandDescription(item.description),
    }));

  return [
    ...slashTips,
    ...SHORTCUT_TIPS.filter((tip) => !BUILTIN_SLASH_COMMANDS.some((command) => command.label === tip.label)),
  ];
}

function randomTipIndex(length: number): number {
  return length > 0 ? Math.floor(Math.random() * length) : 0;
}
