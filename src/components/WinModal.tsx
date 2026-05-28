"use client";

import { useEffect, useState } from "react";
import { Box } from "@mui/material";
import {
  designFrameShellSx,
  designFrameSx,
  FrameLoading,
  Hotspot,
  OverlayBox,
} from "@/components/DesignFrame";
import { RESULT_CLOSE_HOTSPOT, RESULT_LUCKY_NUMBER } from "@/lib/design-layout";
import { formatLuckyNumber } from "@/lib/format-lucky-number";
import { preloadResultAssets } from "@/lib/preload-images";
import type { SpinResult } from "@/lib/types";

type WinModalProps = {
  open: boolean;
  result: SpinResult | null;
  onConfirm: () => void;
};

export function WinModal({ open, result, onConfirm }: WinModalProps) {
  const [assetsReady, setAssetsReady] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    void preloadResultAssets().then(() => {
      if (!cancelled) setAssetsReady(true);
    });
    return () => {
      cancelled = true;
      setAssetsReady(false);
    };
  }, [open]);

  if (!open || !result) return null;

  const displayNumber = formatLuckyNumber(result.luckyNumber);

  const frame = (
    <Box sx={designFrameShellSx}>
      <Box sx={designFrameSx}>
        {!assetsReady && <FrameLoading />}
        <Box
          component="img"
          src="/bg_bag.png"
          alt=""
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
            opacity: assetsReady ? 1 : 0,
          }}
        />

        {assetsReady && (
          <>
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
              <OverlayBox
                top={RESULT_LUCKY_NUMBER.top}
                left={RESULT_LUCKY_NUMBER.left}
                width={RESULT_LUCKY_NUMBER.width}
                height={RESULT_LUCKY_NUMBER.height}
              >
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
                top={RESULT_CLOSE_HOTSPOT.top}
                left={RESULT_CLOSE_HOTSPOT.left}
                width={RESULT_CLOSE_HOTSPOT.width}
                height={RESULT_CLOSE_HOTSPOT.height}
                ariaLabel="Đóng"
                onClick={onConfirm}
              />
            </Box>
          </Box>
        </Box>
          </>
        )}
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
