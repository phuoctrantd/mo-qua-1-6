"use client";

import { CssBaseline } from "@mui/material";
import { ThemeProvider, createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#FF6B9D", light: "#FF9EC0", dark: "#E84A82" },
    secondary: { main: "#6BCBFF", light: "#9DDEFF", dark: "#3BB5F5" },
    warning: { main: "#FFD93D" },
    success: { main: "#6EE7B7" },
    background: { default: "#FFF8F0", paper: "#FFFFFF" },
    text: { primary: "#2D1B4E", secondary: "#5C4D7A" },
  },
  shape: {
    borderRadius: 20,
  },
  typography: {
    fontFamily:
      'var(--font-fredoka), "Comic Sans MS", "Segoe UI", system-ui, sans-serif',
    h3: { fontWeight: 800 },
    button: { fontWeight: 800, textTransform: "none" as const },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 999,
          padding: "12px 28px",
          boxShadow: "0 4px 0 rgba(0,0,0,0.12)",
        },
        contained: {
          "&:hover": {
            boxShadow: "0 6px 0 rgba(0,0,0,0.1)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 24,
          boxShadow: "0 8px 32px rgba(255,107,157,0.12)",
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 16,
            backgroundColor: "#fff",
          },
        },
      },
    },
  },
});

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
