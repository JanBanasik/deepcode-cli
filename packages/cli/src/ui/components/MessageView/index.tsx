import { theme } from "../../theme";
import React from "react";
import { Box, Text } from "ink";
import { renderMarkdown, renderMarkdownSegments } from "./markdown";
import {
  buildThinkingSummary,
  buildToolSummary,
  formatStatusName,
  formatToolStatusParams,
  getToolDiffPreviewLines,
  getUpdatePlanPreviewLines,
} from "./utils";
import type { DiffPreviewLine, MessageViewProps } from "./types";
import { RawMode, useRawModeContext } from "../../contexts";

const PROMPT_ECHO_PREFIX_WIDTH = 2;
const PROMPT_ECHO_MARGIN_LEFT = 1;

export function MessageView({ message, collapsed, width = 80 }: MessageViewProps): React.ReactElement | null {
  const { mode } = useRawModeContext();
  if (!message.visible) {
    return null;
  }

  if (message.role === "user") {
    const content = message.content || "(no content)";
    const text = message.meta?.isAnswers ? renderMarkdown(content) : content;
    return (
      <PromptEchoLine
        text={text}
        width={width}
        attachmentCount={Array.isArray(message.contentParams) ? message.contentParams.length : 0}
      />
    );
  }

  if (message.role === "assistant") {
    const isThinking = Boolean(message.meta?.asThinking);
    const content = (message.content || "").trim();

    if (isThinking) {
      const summary = buildThinkingSummary(content, message.messageParams, mode);
      if (collapsed !== false) {
        return (
          <Box marginLeft={1} marginBottom={1} marginY={0}>
            <StatusLine width={width} bulletColor={theme.muted} name="Thinking" params={summary} />
          </Box>
        );
      }
      return (
        <Box marginLeft={1} flexDirection="column" marginBottom={1} marginY={0}>
          <StatusLine width={width} bulletColor={theme.muted} name="Thinking" params={content ? "" : summary} />
          <Box flexDirection="column" marginLeft={2}>
            {content ? <Text color={theme.muted}>{renderMarkdown(content)}</Text> : null}
          </Box>
        </Box>
      );
    }

    const containerWidth = Math.max(1, width - 2);
    const contentWidth = Math.max(1, width - 4);

    return (
      <Box marginLeft={1} marginBottom={1} width={containerWidth} gap={1} marginY={0} flexDirection="row">
        <Box alignSelf="stretch">
          <Text color={theme.primary}>✦</Text>
        </Box>
        <Box flexGrow={1} width={contentWidth} flexDirection="column">
          {content
            ? renderMarkdownSegments(content, Math.max(20, contentWidth - 4)).map((seg, i) => {
                if (seg.kind === "table") {
                  return (
                    <Box key={i} flexDirection="column">
                      {seg.body.split("\n").map((line, lineIndex) => (
                        <Text key={lineIndex} wrap="truncate-end">
                          {line}
                        </Text>
                      ))}
                    </Box>
                  );
                }
                return <Text key={i}>{seg.body}</Text>;
              })
            : null}
        </Box>
      </Box>
    );
  }

  if ((message.role === "system" || message.role === "tool") && message.meta?.skill) {
    return (
      <Box marginY={0} marginLeft={1} marginBottom={1}>
        <Text color={theme.primary}>⚡ Loaded skill: {message.meta.skill.name}</Text>
      </Box>
    );
  }

  if (message.role === "tool") {
    const summary = buildToolSummary(message);
    const diffLines = getToolDiffPreviewLines(summary);
    const planLines = getUpdatePlanPreviewLines(summary);
    return (
      <Box flexDirection="column" marginLeft={1} marginBottom={1} marginY={0}>
        <StatusLine
          width={width}
          bulletColor={summary.ok ? theme.success : theme.error}
          symbol={summary.ok ? "✓" : "✗"}
          name={formatStatusName(summary.name)}
          params={formatToolStatusParams(summary)}
        />
        {diffLines.length > 0 ? <DiffPreview lines={diffLines} /> : null}
        {planLines.length > 0 ? <PlanPreview lines={planLines} /> : null}
      </Box>
    );
  }

  if (message.role === "system") {
    // Render model change messages in the same style as user commands.
    if (message.meta?.isModelChange) {
      return <PromptEchoLine text={message.content || ""} width={width} />;
    }

    if (message.meta?.isSummary) {
      return (
        <Box marginY={0} marginLeft={1} marginBottom={1}>
          <Text color={theme.muted} italic>
            (conversation summary inserted)
          </Text>
        </Box>
      );
    }
    return null;
  }

  return null;
}

export function getPromptEchoContentWidth(width: number): number {
  return Math.max(1, width - PROMPT_ECHO_MARGIN_LEFT - PROMPT_ECHO_PREFIX_WIDTH);
}

function PromptEchoLine({
  text,
  width,
  attachmentCount = 0,
}: {
  text: string;
  width: number;
  attachmentCount?: number;
}): React.ReactElement {
  const contentWidth = getPromptEchoContentWidth(width);
  const containerWidth = Math.max(1, width - PROMPT_ECHO_MARGIN_LEFT);
  return (
    <Box marginBottom={1} marginLeft={PROMPT_ECHO_MARGIN_LEFT} marginY={0} width={containerWidth} flexDirection="row">
      <Box width={PROMPT_ECHO_PREFIX_WIDTH}>
        <Text color={theme.primary}>{"> "}</Text>
      </Box>
      <Box flexGrow={1} flexShrink={1} width={contentWidth}>
        <Text color={theme.primary} wrap="hard">
          {text}
        </Text>
        {attachmentCount > 0 ? (
          <Text color={theme.primary}>{`  📎 ${attachmentCount} image attachment(s)`}</Text>
        ) : null}
      </Box>
    </Box>
  );
}

function StatusLine({
  bulletColor,
  symbol = "✧",
  name,
  params,
  width,
}: {
  bulletColor: string | undefined;
  symbol?: string;
  name: string;
  params: string;
  width: number;
}): React.ReactElement {
  const { mode } = useRawModeContext();
  const containerWidth = Math.max(1, width - 2);
  const contentWidth = Math.max(1, width - 4);
  return (
    <Box gap={1} width={containerWidth}>
      <Box alignSelf="stretch">
        <Text key="bullet" color={bulletColor}>
          {symbol}
        </Text>
      </Box>
      <Box flexGrow={1} width={contentWidth} gap={1}>
        <Text wrap={mode === RawMode.Lite ? "truncate-end" : "wrap"}>
          <Text key="name" bold>
            {name}
          </Text>
          {params ? (
            <Text key="params" color={theme.text}>
              {` ${params}`}
            </Text>
          ) : null}
        </Text>
      </Box>
    </Box>
  );
}

function DiffPreview({ lines }: { lines: DiffPreviewLine[] }): React.ReactElement {
  return (
    <Box flexDirection="column" marginLeft={2}>
      <Text color={theme.muted}>└ Changes</Text>
      <Box flexDirection="column" marginLeft={2}>
        {lines.map((line, index) => (
          <Text key={`${index}-${line.marker}-${line.content}`} wrap="truncate-end">
            <Text color={line.kind === "added" ? theme.success : line.kind === "removed" ? theme.error : theme.muted}>
              {line.marker}
            </Text>
            <Text color={line.kind === "added" ? theme.success : line.kind === "removed" ? theme.error : undefined}>
              {line.content}
            </Text>
          </Text>
        ))}
      </Box>
    </Box>
  );
}

function PlanPreview({ lines }: { lines: string[] }): React.ReactElement {
  return (
    <Box flexDirection="column" marginLeft={2}>
      <Text color={theme.muted}>└ Plan</Text>
      <Box flexDirection="column" marginLeft={2}>
        {lines.map((line, index) => (
          <Text key={`${index}-${line}`} wrap="wrap">
            {line}
          </Text>
        ))}
      </Box>
    </Box>
  );
}
