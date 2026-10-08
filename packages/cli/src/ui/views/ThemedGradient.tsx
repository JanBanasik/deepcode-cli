import React from "react";
import { Text, type TextProps } from "ink";
import Gradient from "ink-gradient";
import { colorsDisabled, theme } from "../theme";

export const ThemedGradient: React.FC<TextProps> = ({ children, ...props }) => {
  if (!colorsDisabled && theme.primary && theme.secondary) {
    return (
      <Gradient colors={[theme.primary, theme.secondary]}>
        <Text {...props}>{children}</Text>
      </Gradient>
    );
  }

  return <Text {...props}>{children}</Text>;
};
