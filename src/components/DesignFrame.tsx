"use client";

import { useEffect, useState } from "react";
import { Box, CircularProgress } from "@mui/material";
import { DESIGN_H, DESIGN_W } from "@/lib/design-layout";
import { preloadImages } from "@/lib/preload-images";

const DESIGN_RATIO = DESIGN_W / DESIGN_H;

export { DESIGN_H, DESIGN_W };

/** Fit 941×1672 inside the viewport so overlay % matches the artwork on every device. */
export const designFrameSx = {
  position: "relative",
  overflow: "hidden",
  containerType: "inline-size",
  flexShrink: 0,
  bgcolor: "#87CEEB",
  aspectRatio: `${DESIGN_W} / ${DESIGN_H}`,
  width: `min(100vw, calc(100dvh * ${DESIGN_RATIO}), ${DESIGN_W}px)`,
  height: `min(100dvh, calc(100vw / ${DESIGN_RATIO}))`,
  maxWidth: `${DESIGN_W}px`,
} as const;

export const designFrameShellSx = {
  width: "100%",
  minHeight: "100dvh",
  height: "100dvh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  bgcolor: "#87CEEB",
} as const;

export function FrameLoading() {
  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 20,
        bgcolor: "#87CEEB",
      }}
    >
      <CircularProgress size={48} sx={{ color: "#ff4d8d" }} />
    </Box>
  );
}

type DesignFrameProps = {
  src: string;
  extraSrcs?: readonly string[];
  children?: React.ReactNode;
};

/** Full-screen portrait frame; background image uses cover (no side gaps on mobile). */
export function DesignFrame({ src, extraSrcs = [], children }: DesignFrameProps) {
  const assetsKey = [src, ...extraSrcs].join("|");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const urls = assetsKey.split("|");
    void preloadImages(urls).then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
      setReady(false);
    };
  }, [assetsKey]);

  return (
    <Box sx={designFrameShellSx}>
      <Box sx={designFrameSx}>
        {!ready && <FrameLoading />}
        <Box
          component="img"
          src={src}
          alt=""
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center top",
            display: "block",
            userSelect: "none",
            pointerEvents: "none",
            opacity: ready ? 1 : 0,
          }}
          draggable={false}
        />
        {ready ? children : null}
      </Box>
    </Box>
  );
}

type OverlayBoxProps = {
  top: string;
  left: string;
  width: string;
  height?: string;
  children: React.ReactNode;
};

type HotspotProps = {
  top: string;
  left: string;
  width: string;
  height: string;
  disabled?: boolean;
  onClick?: () => void;
  ariaLabel: string;
  children?: React.ReactNode;
};

/** Invisible tap target — use when control is drawn on the background image. */
export function Hotspot({
  top,
  left,
  width,
  height,
  disabled,
  onClick,
  ariaLabel,
  children,
}: HotspotProps) {
  return (
    <Box
      role="button"
      aria-label={ariaLabel}
      tabIndex={disabled ? -1 : 0}
      onClick={disabled ? undefined : onClick}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === "Enter" || e.key === " ") onClick?.();
      }}
      sx={{
        position: "absolute",
        top,
        left,
        width,
        height,
        cursor: disabled ? "default" : "pointer",
        pointerEvents: "auto",
        bgcolor: "transparent",
        zIndex: 5,
        border: "none",
        outline: "none",
        WebkitTapHighlightColor: "transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </Box>
  );
}

export function OverlayBox({ top, left, width, height, children }: OverlayBoxProps) {
  return (
    <Box
      sx={{
        position: "absolute",
        top,
        left,
        width,
        height,
        zIndex: 2,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </Box>
  );
}

type PinkButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
  fullWidth?: boolean;
};

export function PinkButton({
  children,
  onClick,
  disabled,
  type = "button",
  fullWidth = true,
}: PinkButtonProps) {
  return (
    <Box
      component="button"
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      sx={{
        width: fullWidth ? "100%" : "auto",
        minHeight: "4.8cqw",
        border: "none",
        borderRadius: "999px",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.65 : 1,
        background: "linear-gradient(180deg, #ff9ec8 0%, #ff5a9a 45%, #e91e7a 100%)",
        boxShadow:
          "0 0.4cqw 0 #c2185b, 0 0.8cqw 2cqw rgba(233, 30, 122, 0.35), inset 0 0.2cqw 0 rgba(255,255,255,0.35)",
        color: "#fff",
        fontWeight: 900,
        fontSize: "2.1cqw",
        letterSpacing: "0.05cqw",
        textTransform: "uppercase",
        fontFamily: "inherit",
        lineHeight: 1.2,
        WebkitTapHighlightColor: "transparent",
        px: "2cqw",
        py: "1.2cqw",
        "&:active:not(:disabled)": {
          transform: "translateY(0.2cqw)",
          boxShadow: "0 0.2cqw 0 #c2185b, 0 0.4cqw 1.2cqw rgba(233, 30, 122, 0.3)",
        },
      }}
    >
      {children}
    </Box>
  );
}
