export const theme = {
  colors: {
    primary: "#0B1F3B",
    accent: "#00B3A4",
    warning: "#F59E0B",
    critical: "#EF4444",
    background: "#F8FAFC",
    card: "#FFFFFF"
  },
  radius: "0.75rem",
  spacingUnit: 8
} as const;

export type AppTheme = typeof theme;
