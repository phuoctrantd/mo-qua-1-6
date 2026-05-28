"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Box, Button, Typography } from "@mui/material";
import { DESIGN_H, DESIGN_W } from "@/lib/design-layout";

const FRAME_RATIO = DESIGN_W / DESIGN_H;
/** Same width formula as DesignFrame, scaled to ~88% for the white card area. */
const MODAL_WIDTH = `min(calc(100dvh * ${FRAME_RATIO} * 0.88), calc(100vw * 0.88), ${Math.round(DESIGN_W * 0.88)}px)`;

type ErrorAlertModalProps = {
  open: boolean;
  message: string | null;
  onClose: () => void;
};

/** Full-viewport overlay; card width tracks the game frame (not raw vw on desktop). */
export function ErrorAlertModal({ open, message, onClose }: ErrorAlertModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!open || !message || !mounted) return null;

  return createPortal(
    <Box
      role="alertdialog"
      aria-modal
      aria-labelledby="error-alert-title"
      aria-describedby="error-alert-message"
      onClick={onClose}
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 1400,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "rgba(0,0,0,0.45)",
        p: 2,
      }}
    >
      <Box
        onClick={(e) => e.stopPropagation()}
        sx={{
          width: MODAL_WIDTH,
          maxWidth: "100%",
          bgcolor: "#fff",
          borderRadius: 4,
          border: "4px solid #FFD93D",
          boxShadow: "0 16px 48px rgba(45, 27, 78, 0.22)",
          overflow: "hidden",
          animation: "pop-in 0.25s ease-out",
        }}
      >
        <Typography
          id="error-alert-title"
          component="h2"
          sx={{
            fontWeight: 900,
            textAlign: "center",
            fontSize: "clamp(1.2rem, 4.2vw, 1.6rem)",
            pt: 3,
            px: 2.5,
            color: "text.primary",
          }}
        >
          Có lỗi rồi!
        </Typography>
        <Typography
          id="error-alert-message"
          sx={{
            textAlign: "center",
            color: "text.secondary",
            fontSize: "clamp(0.95rem, 3.6vw, 1.1rem)",
            lineHeight: 1.55,
            px: 2.5,
            pt: 1.5,
            pb: 2,
            wordBreak: "break-word",
          }}
        >
          {message}
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "center", pb: 3, px: 2.5 }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={onClose}
            sx={{
              borderRadius: 999,
              width: "100%",
              maxWidth: 280,
              fontSize: "1.1rem",
              fontWeight: 800,
              py: 1.35,
            }}
          >
            OK
          </Button>
        </Box>
      </Box>
    </Box>,
    document.body,
  );
}
