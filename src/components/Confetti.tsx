"use client";

import { Box } from "@mui/material";

const COLORS = ["#FF6B9D", "#FFD93D", "#6BCBFF", "#6EE7B7", "#C084FC"];

export function Confetti({ active }: { active: boolean }) {
  if (!active) return null;

  return (
    <Box
      aria-hidden
      sx={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 9999,
        overflow: "hidden",
      }}
    >
      {Array.from({ length: 40 }).map((_, i) => (
        <Box
          key={i}
          sx={{
            position: "absolute",
            left: `${(i * 17) % 100}%`,
            top: -20,
            width: 8 + (i % 4) * 2,
            height: 8 + (i % 3) * 2,
            borderRadius: i % 2 === 0 ? "50%" : 1,
            bgcolor: COLORS[i % COLORS.length],
            animation: `confetti-fall ${2.5 + (i % 5) * 0.3}s linear forwards`,
            animationDelay: `${(i % 10) * 0.08}s`,
          }}
        />
      ))}
    </Box>
  );
}
