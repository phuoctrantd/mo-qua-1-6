"use client";

import { Box } from "@mui/material";

const BUBBLES = [
  { top: "8%", left: "5%", size: 48, color: "#FFD93D88", delay: 0 },
  { top: "15%", right: "8%", size: 36, color: "#FF6B9D66", delay: 0.5 },
  { top: "55%", left: "3%", size: 56, color: "#6BCBFF55", delay: 1 },
  { top: "70%", right: "5%", size: 44, color: "#6EE7B766", delay: 0.3 },
  { top: "35%", right: "12%", size: 28, color: "#FFD93D99", delay: 0.8 },
];

export function KidBackground() {
  return (
    <Box
      aria-hidden
      sx={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 0,
        overflow: "hidden",
      }}
    >
      {BUBBLES.map((b, i) => (
        <Box
          key={i}
          sx={{
            position: "absolute",
            top: b.top,
            left: "left" in b ? b.left : undefined,
            right: "right" in b ? b.right : undefined,
            width: b.size,
            height: b.size,
            borderRadius: "50%",
            bgcolor: b.color,
            animation: `float-bubble ${3 + i * 0.4}s ease-in-out infinite`,
            animationDelay: `${b.delay}s`,
          }}
        />
      ))}
      <Box
        sx={{
          position: "absolute",
          top: "12%",
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: { xs: "2rem", md: "2.5rem" },
          opacity: 0.35,
        }}
      >
        🎁 🎈 ⭐
      </Box>
    </Box>
  );
}
