"use client";

import type { RefObject } from "react";
import { Box } from "@mui/material";
import {
  designFrameShellSx,
  designFrameSx,
  Hotspot,
  OverlayBox,
} from "@/components/DesignFrame";
import { formatLuckyNumber } from "@/lib/format-lucky-number";
import type { SpinResult } from "@/lib/types";

type WinModalProps = {
  open: boolean;
  result: SpinResult | null;
  captureRef?: RefObject<HTMLDivElement | null>;
  onConfirm: () => void;
};

export function WinModal({ open, result, captureRef, onConfirm }: WinModalProps) {
  if (!open || !result) return null;

  const displayNumber = formatLuckyNumber(result.luckyNumber);

  const frame = (
    <Box ref={captureRef} sx={designFrameShellSx}>
      <Box sx={designFrameSx}>
      <Box
        component="img"
        src="/bg_bag.png"
        alt=""
        crossOrigin="anonymous"
        draggable={false}
        sx={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center top",
          pointerEvents: "none",
          userSelect: "none",
        }}
      />

      <Box
        aria-hidden
        sx={{
          position: "absolute",
          inset: 0,
          bgcolor: "rgba(0,0,0,0.2)",
          pointerEvents: "none",
        }}
      />

      <Box
        sx={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: "7%",
          py: "12%",
          zIndex: 2,
        }}
      >
        <Box
          sx={{
            position: "relative",
            width: "100%",
            maxHeight: "100%",
            containerType: "inline-size",
            isolation: "isolate",
          }}
        >
          <Box
            component="img"
            src="/bg_result.png"
            alt=""
            crossOrigin="anonymous"
            draggable={false}
            sx={{
              width: "100%",
              height: "auto",
              display: "block",
              pointerEvents: "none",
              userSelect: "none",
            }}
          />

          <Box sx={{ position: "absolute", inset: 0 }}>
            <OverlayBox top="34.5%" left="22%" width="56%" height="13.5%">
              <Box
                component="span"
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  height: "100%",
                  fontWeight: 700,
                  fontSize: "11.5cqw",
                  letterSpacing: "0.9cqw",
                  lineHeight: 1,
                  color: "#ff4d8d",
                  textAlign: "center",
                  fontVariantNumeric: "tabular-nums",
                  pt: "0.3cqw",
                }}
              >
                {displayNumber}
              </Box>
            </OverlayBox>

            <Hotspot
              top="75.2%"
              left="9%"
              width="82%"
              height="7.2%"
              ariaLabel="Đóng"
              onClick={onConfirm}
            />
          </Box>
        </Box>
      </Box>
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        zIndex: 1200,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        bgcolor: "rgba(0,0,0,0.35)",
        overflow: "auto",
        p: 0,
      }}
    >
      {frame}
    </Box>
  );
}
