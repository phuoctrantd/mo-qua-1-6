"use client";

import { Box } from "@mui/material";

/** Design canvas: 941×1672 (mobile portrait). */
export const DESIGN_W = 941;
export const DESIGN_H = 1672;
/** Shared frame box — full viewport on phone, max 941px wide on desktop. */
export const designFrameSx = {
  width: "100vw",
  height: "100dvh",
  maxWidth: `${DESIGN_W}px`,
  mx: "auto",
  position: "relative",
  overflow: "hidden",
  containerType: "inline-size",
  flexShrink: 0,
  bgcolor: "#87CEEB",
} as const;

type DesignFrameProps = {
  src: string;
  children?: React.ReactNode;
};

/** Full-screen portrait frame; background image uses cover (no side gaps on mobile). */
export function DesignFrame({ src, children }: DesignFrameProps) {
  return (
    <Box sx={designFrameSx}>
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
        }}
        draggable={false}
      />
      {children}
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
