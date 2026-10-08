import React from "react";
import { Box, Text } from "ink";
import {
  buildSessionStatusSegments,
  SESSION_STATUS_SEPARATOR,
  type SessionStatusInput,
} from "../statusline/session-status";
import { theme } from "../theme";

export function SessionStatus(props: SessionStatusInput): React.ReactElement {
  const segments = buildSessionStatusSegments(props);
  return (
    <Box width={props.width}>
      <Text wrap="truncate-end">
        {segments.map((segment, index) => (
          <React.Fragment key={segment.id}>
            {index > 0 ? <Text color={theme.border}>{SESSION_STATUS_SEPARATOR}</Text> : null}
            <Text color={segment.color}>{segment.text}</Text>
          </React.Fragment>
        ))}
      </Text>
    </Box>
  );
}
