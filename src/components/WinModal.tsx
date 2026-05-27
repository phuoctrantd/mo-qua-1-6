"use client";

import type { RefObject } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  Typography,
} from "@mui/material";
import type { SpinResult } from "@/lib/types";

type WinModalProps = {
  open: boolean;
  result: SpinResult | null;
  captureRef?: RefObject<HTMLDivElement | null>;
  onConfirm: () => void;
};

export function WinModal({ open, result, captureRef, onConfirm }: WinModalProps) {
  if (!result) return null;

  const isReplay = Boolean(result.alreadySpun);

  return (
    <Dialog
      open={open}
      onClose={onConfirm}
      maxWidth="xs"
      fullWidth
      disablePortal
      slotProps={{
        paper: {
          sx: {
            borderRadius: 4,
            border: "4px solid #FFD93D",
            overflow: "visible",
          },
        },
      }}
    >
      <DialogContent sx={{ textAlign: "center", py: 4, px: 3 }}>
        <Box ref={captureRef}>
          <Typography variant="h5" fontWeight={800} sx={{ mb: 1 }}>
            {isReplay ? "🎁 Quà của bé" : "🎉 Chúc mừng"} {result.childName}!
          </Typography>

          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            {isReplay ? "Bé đã quay và nhận được" : "Bé trúng"}
          </Typography>

          {result.giftImageUrl ? (
            <Box
              component="img"
              src={result.giftImageUrl}
              alt={result.giftName}
              crossOrigin="anonymous"
              sx={{
                width: { xs: 140, sm: 180 },
                height: { xs: 140, sm: 180 },
                objectFit: "cover",
                borderRadius: 4,
                border: "4px solid #FF6B9D",
                boxShadow: "0 8px 24px rgba(255,107,157,0.35)",
                mx: "auto",
                mb: 2,
                display: "block",
              }}
            />
          ) : (
            <Typography sx={{ fontSize: "5rem", mb: 2, lineHeight: 1 }}>🎁</Typography>
          )}

          <Typography
            variant="h4"
            fontWeight={800}
            color="primary.main"
            sx={{ mb: 1, fontSize: { xs: "1.6rem", sm: "2rem", md: "2.25rem" } }}
          >
            {result.giftName}
          </Typography>

          {!isReplay && (
            <Typography variant="caption" color="text.secondary">
              Chúc bé vui vẻ nhé! 💝
            </Typography>
          )}
        </Box>

        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={onConfirm}
          sx={{ mt: 3, borderRadius: 999, px: 5 }}
        >
          OK
        </Button>
      </DialogContent>
    </Dialog>
  );
}
