"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { Confetti } from "@/components/Confetti";
import { captureScreenPng } from "@/lib/capture-screen";
import {
  BAG_CTA_BUTTON,
  BAG_MYSTERY_HOTSPOT,
  DOB_CONFIRM_HOTSPOT,
  DOB_INPUT,
} from "@/lib/design-layout";
import { preloadBagScreen, preloadResultAssets } from "@/lib/preload-images";
import { waitForCaptureReady } from "@/lib/wait-for-capture";
import { DesignFrame, Hotspot, OverlayBox } from "@/components/DesignFrame";
import { WinModal } from "@/components/WinModal";
import type { SpinResult } from "@/lib/types";

export default function Home() {
  const [dob, setDob] = useState("");
  const [step, setStep] = useState<"dob" | "bag">("dob");
  const [submittingDob, setSubmittingDob] = useState(false);
  const [openingBag, setOpeningBag] = useState(false);
  const [spinResult, setSpinResult] = useState<SpinResult | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const captureAllRef = useRef<HTMLDivElement | null>(null);
  const resultCaptureRef = useRef<HTMLDivElement | null>(null);

  const dobOk = useMemo(() => /^\d{8}$/.test(dob), [dob]);

  function resetAll() {
    setDob("");
    setStep("dob");
    setError(null);
    setSpinResult(null);
    setModalOpen(false);
    setShowConfetti(false);
    setSubmittingDob(false);
    setOpeningBag(false);
  }

  function onDobChange(value: string) {
    setDob(value.replace(/[^\d]/g, "").slice(0, 8));
    if (error) setError(null);
  }

  async function uploadScreenshotSilently(result: SpinResult) {
    try {
      const node = resultCaptureRef.current;
      if (!node) return;

      const ready = await waitForCaptureReady(node);
      if (!ready) return;

      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

      const dataUrl = await captureScreenPng(node, "#87CEEB");

      await fetch(`/api/spin/${result.spinId}/screenshot`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pngDataUrl: dataUrl }),
      });
    } catch {
      // Silent
    }
  }

  async function showResultModal(result: SpinResult, withConfetti: boolean) {
    await preloadResultAssets();
    setSpinResult(result);
    setModalOpen(true);
    if (withConfetti) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
    }
  }

  async function handleDobSubmit() {
    if (!dobOk) {
      setError("Ngày sinh phải đúng 8 số ví dụ 01062026.");
      return;
    }

    setError(null);
    setSpinResult(null);
    setModalOpen(false);
    setShowConfetti(false);
    setSubmittingDob(true);

    try {
      const priorRes = await fetch(
        `/api/spin/by-dob?dob=${encodeURIComponent(dob)}`,
      );
      const priorData = (await priorRes.json()) as
        | { ok: true; alreadySpun: false }
        | { ok: true; alreadySpun: true; result: SpinResult }
        | { ok: false; error: string };

      if (!priorRes.ok || !priorData.ok) {
        setError(priorData.ok ? "Lỗi kiểm tra." : priorData.error);
        return;
      }

      if (priorData.alreadySpun) {
        setStep("bag");
        await showResultModal({ ...priorData.result, alreadySpun: true }, false);
        return;
      }

      setStep("bag");
      void preloadBagScreen();
      void preloadResultAssets();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xác nhận thất bại.");
    } finally {
      setSubmittingDob(false);
    }
  }

  const openBag = useCallback(async () => {
    if (!dobOk) {
      setError("Ngày sinh phải đúng 8 số ví dụ 01062026.");
      setStep("dob");
      return;
    }
    setOpeningBag(true);
    try {
      const spinRes = await fetch("/api/spin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ dob }),
      });
      const spinData = (await spinRes.json()) as
        | {
            ok: true;
            result: { spinId: string; childName: string; luckyNumber: string };
          }
        | { ok: false; error: string };

      if (!spinRes.ok || !spinData.ok) {
        throw new Error(spinData.ok ? "Unknown error" : spinData.error);
      }

      const result: SpinResult = {
        spinId: spinData.result.spinId,
        childName: spinData.result.childName,
        luckyNumber: String(spinData.result.luckyNumber ?? "").trim(),
        alreadySpun: false,
      };

      await showResultModal(result, true);
      void uploadScreenshotSilently(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bóc túi thất bại.");
    } finally {
      setOpeningBag(false);
    }
  }, [dob, dobOk]);

  return (
    <Box ref={captureAllRef} sx={{ position: "relative" }}>
      <Confetti active={showConfetti} />

      <Dialog
        open={Boolean(error)}
        onClose={() => setError(null)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: 4,
              border: "4px solid #FFD93D",
              overflow: "hidden",
            },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 900, textAlign: "center" }}>
          Có lỗi rồi!
        </DialogTitle>
        <DialogContent sx={{ textAlign: "center", pt: 1 }}>
          <Typography color="text.secondary">{error}</Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 3, px: 3 }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={() => setError(null)}
            sx={{ borderRadius: 999, px: 5 }}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>

      {step === "dob" ? (
        <DesignFrame src="/bg_dob.png">
          <OverlayBox
            top={DOB_INPUT.top}
            left={DOB_INPUT.left}
            width={DOB_INPUT.width}
            height={DOB_INPUT.height}
          >
            <Box
              component="input"
              value={dob}
              onChange={(e) => onDobChange(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !submittingDob) void handleDobSubmit();
              }}
              inputMode="numeric"
              autoComplete="off"
              disabled={submittingDob}
              aria-label="Ngày sinh của bé"
              sx={{
                width: "100%",
                border: "none",
                outline: "none",
                bgcolor: "transparent",
                textAlign: "center",
                fontWeight: 900,
                fontSize: "3.15cqw",
                letterSpacing: "0.32cqw",
                lineHeight: 1,
                color: "#e91e7a",
                caretColor: "#e91e7a",
                fontFamily: "inherit",
                p: 0,
                m: 0,
                height: "auto",
                minHeight: 0,
                display: "block",
                boxSizing: "border-box",
                WebkitAppearance: "none",
                appearance: "none",
              }}
            />
          </OverlayBox>

          <Hotspot
            top={DOB_CONFIRM_HOTSPOT.top}
            left={DOB_CONFIRM_HOTSPOT.left}
            width={DOB_CONFIRM_HOTSPOT.width}
            height={DOB_CONFIRM_HOTSPOT.height}
            ariaLabel="Xác nhận ngày sinh"
            disabled={submittingDob}
            onClick={() => void handleDobSubmit()}
          >
            {submittingDob && (
              <CircularProgress size={28} sx={{ color: "#ff4d8d" }} />
            )}
          </Hotspot>
        </DesignFrame>
      ) : (
        <DesignFrame src="/bg_bag.png" extraSrcs={["/image_button.png"]}>
          <OverlayBox
            top={BAG_CTA_BUTTON.top}
            left={BAG_CTA_BUTTON.left}
            width={BAG_CTA_BUTTON.width}
            height={BAG_CTA_BUTTON.height}
          >
            {openingBag ? (
              <CircularProgress sx={{ color: "#ff4d8d" }} />
            ) : (
              <Box
                component="button"
                type="button"
                onClick={() => void openBag()}
                aria-label="Nhấn vào đây để bốc túi mù"
                sx={{
                  width: "100%",
                  height: "100%",
                  p: 0,
                  border: "none",
                  bgcolor: "transparent",
                  cursor: "pointer",
                  display: "block",
                  lineHeight: 0,
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <Box
                  component="img"
                  src="/image_button.png"
                  alt=""
                  draggable={false}
                  sx={{
                    width: "100%",
                    height: "100%",
                    objectFit: "fill",
                    display: "block",
                    pointerEvents: "none",
                  }}
                />
              </Box>
            )}
          </OverlayBox>

          <Hotspot
            top={BAG_MYSTERY_HOTSPOT.top}
            left={BAG_MYSTERY_HOTSPOT.left}
            width={BAG_MYSTERY_HOTSPOT.width}
            height={BAG_MYSTERY_HOTSPOT.height}
            ariaLabel="Bóc túi mù"
            disabled={openingBag}
            onClick={() => void openBag()}
          />
        </DesignFrame>
      )}

      <WinModal
        open={modalOpen}
        result={spinResult}
        captureRef={resultCaptureRef}
        onConfirm={resetAll}
      />
    </Box>
  );
}
