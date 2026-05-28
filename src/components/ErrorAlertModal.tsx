"use client";

import { Box, Button, Typography } from "@mui/material";

type ErrorAlertModalProps = {
  open: boolean;
  message: string | null;
  onClose: () => void;
};

/** Full-viewport overlay — avoids MUI Dialog sizing issues inside design layout. */
export function ErrorAlertModal({ open, message, onClose }: ErrorAlertModalProps) {
  if (!open || !message) return null;

  return (
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
        p: { xs: 2, sm: 3 },
      }}
    >
      <Box
        onClick={(e) => e.stopPropagation()}
        sx={{
          width: "min(92vw, 400px)",
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
            fontSize: { xs: "1.35rem", sm: "1.5rem" },
            pt: 3,
            px: 3,
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
            fontSize: { xs: "1rem", sm: "1.05rem" },
            lineHeight: 1.5,
            px: 3,
            pt: 1.5,
            pb: 2,
          }}
        >
          {message}
        </Typography>
        <Box sx={{ display: "flex", justifyContent: "center", pb: 3, px: 3 }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={onClose}
            sx={{
              borderRadius: 999,
              minWidth: 140,
              width: { xs: "100%", sm: "auto" },
              fontSize: "1.05rem",
              py: 1.25,
            }}
          >
            OK
          </Button>
        </Box>
      </Box>
    </Box>
  );
}
