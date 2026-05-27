"use client";

import { Box, Typography, useMediaQuery, useTheme } from "@mui/material";
import { useEffect, useMemo, useRef, useState } from "react";
import type { GiftSegment } from "@/lib/types";

const SLICE_COLORS = [
  "#FF9EC0",
  "#FFD93D",
  "#9DDEFF",
  "#6EE7B7",
  "#C084FC",
  "#FFB347",
  "#FF85A2",
  "#7DD3FC",
];

const SPIN_DURATION_MS = 7000;
const EXTRA_TURNS = 4;
const EDGE_GUARD_DEG_MAX = 10;

type SpinWheelProps = {
  segments: GiftSegment[];
  spinning: boolean;
  /** Gift name returned by the server — index is resolved here to avoid stale state. */
  winningGiftName: string | null;
  /** Stable seed for per-spin random offset (e.g. spinId). */
  spinSeed?: string | null;
  /** Increment to reset wheel rotation without remounting. */
  resetKey?: number;
  onSettled?: () => void;
};

function hashToUnitInterval(seed: string): number {
  // FNV-1a 32-bit
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) / 2 ** 32;
}

function WheelPointer({
  spinning,
  topOffset,
}: {
  spinning: boolean;
  topOffset: number;
}) {
  return (
    <Box
      sx={{
        position: "absolute",
        top: topOffset,
        left: "50%",
        zIndex: 10,
        width: 48,
        height: 48,
        transform: "translateX(-50%)",
        animation: spinning ? "pointer-tick 0.55s ease-in-out infinite" : "none",
        filter: "drop-shadow(0 3px 8px rgba(232,74,130,0.45))",
        pointerEvents: "none",
      }}
    >
      <Box
        component="svg"
        viewBox="0 0 48 48"
        sx={{ width: 48, height: 48, display: "block" }}
      >
        <path
          d="M24 42 L8 14 L40 14 Z"
          fill="#E84A82"
          stroke="#fff"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <circle cx="24" cy="16" r="5" fill="#FFD93D" stroke="#fff" strokeWidth="2" />
      </Box>
    </Box>
  );
}

/** Degrees to rotate (clockwise) so segment `index` center sits at 12 o'clock. */
function rotationForSegmentCenter(index: number, sliceDeg: number): number {
  // We purposely build the wheel so segment centers are at angles i*slice.
  // Therefore, to bring a segment center to 12 o'clock (0deg), rotate by -i*slice.
  const centerFromTop = index * sliceDeg;
  return (360 - centerFromTop + 360) % 360;
}

function SegmentLabel({
  segment,
  angleDeg,
  radiusPx,
}: {
  segment: GiftSegment;
  angleDeg: number;
  radiusPx: number;
}) {
  const hasImage = Boolean(segment.imageUrl?.trim());
  const label =
    segment.name.length > 14 ? `${segment.name.slice(0, 12)}…` : segment.name;

  return (
    <Box
      sx={{
        position: "absolute",
        left: "50%",
        top: "50%",
        width: 0,
        height: 0,
        transform: `rotate(${angleDeg}deg)`,
        pointerEvents: "none",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          left: 0,
          top: 0,
          transform: `translate(-50%, -${radiusPx}px) rotate(${-angleDeg}deg)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0.5,
          width: { xs: 74, sm: 80, md: 88 },
        }}
      >
        {hasImage && (
          <Box
            component="img"
            src={segment.imageUrl!}
            alt=""
            crossOrigin="anonymous"
            sx={{
              width: { xs: 34, sm: 40, md: 44 },
              height: { xs: 34, sm: 40, md: 44 },
              borderRadius: "50%",
              objectFit: "cover",
              border: "2px solid #fff",
              boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
              bgcolor: "#fff",
            }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        )}
        <Box
          sx={{
            bgcolor: "rgba(255,255,255,0.92)",
            borderRadius: 2,
            px: 0.75,
            py: 0.25,
            boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
            maxWidth: { xs: 72, sm: 76, md: 84 },
          }}
        >
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: { xs: "0.58rem", sm: "0.65rem", md: "0.75rem" },
              lineHeight: 1.15,
              color: "#2D1B4E",
              textAlign: "center",
            }}
          >
            {label}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

export function SpinWheel({
  segments,
  spinning,
  winningGiftName,
  spinSeed = null,
  resetKey = 0,
  onSettled,
}: SpinWheelProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));

  const wheelSize = isMobile ? 300 : isTablet ? 360 : 400;
  const ringSize = wheelSize - 8;
  const labelRadius = ringSize * 0.32;

  const [rotation, setRotation] = useState(0);
  const [instantReset, setInstantReset] = useState(false);
  const rotationRef = useRef(0);
  const count = Math.max(segments.length, 1);
  const slice = 360 / count;

  const gradient = useMemo(() => {
    const stops = segments.map((_, i) => {
      const start = (i / count) * 100;
      const end = ((i + 1) / count) * 100;
      return `${SLICE_COLORS[i % SLICE_COLORS.length]} ${start}% ${end}%`;
    });
    // Shift by -slice/2 so the CENTER of segment 0 sits at 12 o'clock.
    const startAngle = -slice / 2;
    return `conic-gradient(from ${startAngle}deg, ${stops.join(", ")})`;
  }, [segments, count, slice]);

  const spinTransition =
    spinning && !instantReset
      ? `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.12, 0.85, 0.22, 1)`
      : "none";
  // rotate3d + will-change helps iOS Safari actually animate the spin.
  const spinTransform = `rotate3d(0, 0, 1, ${rotation}deg)`;

  /** Survives Strict Mode re-run so we don't double-count extra turns. */
  const spinTargetRotationRef = useRef<number | null>(null);
  const spinOffsetDegRef = useRef<number>(0);

  useEffect(() => {
    setInstantReset(true);
    rotationRef.current = 0;
    spinTargetRotationRef.current = null;
    spinOffsetDegRef.current = 0;
    setRotation(0);
    const id = requestAnimationFrame(() => setInstantReset(false));
    return () => cancelAnimationFrame(id);
  }, [resetKey]);

  useEffect(() => {
    if (!spinning) {
      spinTargetRotationRef.current = null;
      spinOffsetDegRef.current = 0;
    }
  }, [spinning]);

  useEffect(() => {
    if (!spinning || !winningGiftName) return;

    const idx = segments.findIndex(
      (s) => s.name.trim() === winningGiftName.trim(),
    );
    if (idx < 0) return;

    let next = spinTargetRotationRef.current;
    if (next === null) {
      // Randomize within the winning slice, but keep a safe distance from both edges.
      const guard = Math.min(EDGE_GUARD_DEG_MAX, slice * 0.18);
      const margin = Math.max(0, slice / 2 - guard);

      if (margin > 0) {
        const u = hashToUnitInterval(
          `${spinSeed ?? "no-seed"}|${winningGiftName}|${idx}|${count}`,
        );
        // [-margin, +margin]
        spinOffsetDegRef.current = (u * 2 - 1) * margin;
      } else {
        spinOffsetDegRef.current = 0;
      }

      const targetMod =
        (rotationForSegmentCenter(idx, slice) + spinOffsetDegRef.current + 360) %
        360;
      const currentMod = ((rotationRef.current % 360) + 360) % 360;
      let delta = (targetMod - currentMod + 360) % 360;
      if (delta < 0.5) delta = 360;
      next = rotationRef.current + EXTRA_TURNS * 360 + delta;
      spinTargetRotationRef.current = next;
    }

    // Safari iOS skips CSS transition if the final transform is set before first paint.
    let cancelled = false;
    let timerId: number | undefined;
    let raf2 = 0;

    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        if (cancelled) return;
        rotationRef.current = next!;
        setRotation(next!);
        timerId = window.setTimeout(
          () => onSettled?.(),
          SPIN_DURATION_MS + 80,
        );
      });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf1);
      if (raf2) cancelAnimationFrame(raf2);
      if (timerId) clearTimeout(timerId);
    };
  }, [spinning, winningGiftName, segments, slice, onSettled, spinSeed, count]);

  if (segments.length === 0) {
    return (
      <Box
        sx={{
          width: wheelSize,
          height: wheelSize,
          mx: "auto",
          borderRadius: "50%",
          bgcolor: "grey.100",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography color="text.secondary">Chưa có quà 🎁</Typography>
      </Box>
    );
  }

  const ringTop = 28;
  const ringCenterY = ringTop + (ringSize + 16) / 2;

  return (
    <Box
      sx={{
        position: "relative",
        width: wheelSize + 24,
        height: wheelSize + 40,
        mx: "auto",
      }}
    >
      <WheelPointer spinning={spinning} topOffset={ringTop - 6} />

      {/* Pin markers on rim at 12 o'clock */}
      <Box
        sx={{
          position: "absolute",
          top: ringTop + 2,
          left: "50%",
          transform: "translateX(-50%)",
          width: 8,
          height: ringSize + 12,
          zIndex: 3,
          pointerEvents: "none",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: 4,
            height: 18,
            bgcolor: "#fff",
            borderRadius: 1,
            boxShadow: "0 0 4px rgba(0,0,0,0.25)",
          }}
        />
      </Box>

      <Box
        sx={{
          position: "absolute",
          top: ringTop,
          left: "50%",
          transform: "translateX(-50%)",
          width: ringSize + 16,
          height: ringSize + 16,
        }}
      >
        <Box
          sx={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            background:
              "repeating-conic-gradient(#FFD93D 0deg 8deg, #FF6B9D 8deg 16deg)",
            p: "6px",
            boxShadow: "0 12px 40px rgba(255,107,157,0.35)",
          }}
        >
          {/* Disc + labels share one transform so they stay aligned */}
          <Box
            sx={{
              position: "relative",
              width: ringSize,
              height: ringSize,
              mx: "auto",
              transform: spinTransform,
              WebkitTransform: spinTransform,
              transition: spinTransition,
              WebkitTransition: spinTransition,
              transitionProperty: "transform",
              transformOrigin: "center center",
              willChange: spinning ? "transform" : "auto",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
          >
            <Box
              sx={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                background: gradient,
                border: "5px solid #fff",
              }}
            />
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
              }}
            >
              {segments.map((seg, i) => {
                const angle = i * slice;
                return (
                  <SegmentLabel
                    key={`${seg.name}-${i}`}
                    segment={seg}
                    angleDeg={angle}
                    radiusPx={labelRadius}
                  />
                );
              })}
            </Box>
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          position: "absolute",
          left: "50%",
          top: ringCenterY,
          transform: "translate(-50%, -50%)",
          width: { xs: 64, sm: 72 },
          height: { xs: 64, sm: 72 },
          borderRadius: "50%",
          background: "linear-gradient(145deg, #fff 0%, #FFE8F5 100%)",
          border: "4px solid #FF6B9D",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 4,
          boxShadow: "0 4px 16px rgba(255,107,157,0.4)",
          fontSize: { xs: "1.5rem", sm: "1.75rem" },
        }}
      >
        ⭐
      </Box>
    </Box>
  );
}
