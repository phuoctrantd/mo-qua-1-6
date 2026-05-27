"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import * as htmlToImage from "html-to-image";
import { Confetti } from "@/components/Confetti";
import { KidBackground } from "@/components/KidBackground";
import { SpinWheel } from "@/components/SpinWheel";
import { WinModal } from "@/components/WinModal";
import type { GiftSegment, SpinResult } from "@/lib/types";

export default function Home() {
  const [dob, setDob] = useState("");
  const [wheelGifts, setWheelGifts] = useState<GiftSegment[]>([]);
  const [wheelLoading, setWheelLoading] = useState(true);
  const [wheelSpinning, setWheelSpinning] = useState(false);
  const [winningGiftName, setWinningGiftName] = useState<string | null>(null);
  const [spinSeed, setSpinSeed] = useState<string | null>(null);
  const [spinLoading, setSpinLoading] = useState(false);
  const [spinResult, setSpinResult] = useState<SpinResult | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wheelResetKey, setWheelResetKey] = useState(0);

  const captureAllRef = useRef<HTMLDivElement | null>(null);
  const pendingResultRef = useRef<SpinResult | null>(null);

  const dobOk = useMemo(() => /^\d{8}$/.test(dob), [dob]);

  const loadPreviewWheel = useCallback(async (silent = false) => {
    if (!silent) setWheelLoading(true);
    try {
      const res = await fetch("/api/gifts/preview");
      const data = (await res.json()) as
        | { ok: true; gifts: GiftSegment[] }
        | { ok: false; error: string };
      if (res.ok && data.ok) {
        setWheelGifts(data.gifts);
      }
    } finally {
      if (!silent) setWheelLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (cancelled) return;
      await loadPreviewWheel();
    })();
    return () => {
      cancelled = true;
    };
  }, [loadPreviewWheel]);

  function resetAll() {
    setDob("");
    setError(null);
    setSpinResult(null);
    setModalOpen(false);
    setShowConfetti(false);
    setWheelSpinning(false);
    setWinningGiftName(null);
    setSpinSeed(null);
    setSpinLoading(false);
    pendingResultRef.current = null;
    setWheelResetKey((k) => k + 1);
    void loadPreviewWheel(true);
  }

  function onDobChange(value: string) {
    setDob(value.replace(/[^\d]/g, "").slice(0, 8));
    if (error) setError(null);
  }

  /** Upload screenshot in background — no UI feedback. */
  async function uploadScreenshotSilently(result: SpinResult) {
    try {
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      await new Promise((r) => setTimeout(r, 400));

      const node = captureAllRef.current;
      if (!node) return;

      const dataUrl = await htmlToImage.toPng(node, {
        pixelRatio: Math.min(2, window.devicePixelRatio || 2),
        backgroundColor: "#ffffff",
        cacheBust: true,
      });

      await fetch(`/api/spin/${result.spinId}/screenshot`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pngDataUrl: dataUrl }),
      });
    } catch {
      // Silent — admin can still check DB; no UI message.
    }
  }

  function showResultModal(result: SpinResult, withConfetti: boolean) {
    setSpinResult(result);
    setModalOpen(true);
    if (withConfetti) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 4000);
    }
  }

  async function onWheelSettled() {
    setWheelSpinning(false);
    const result = pendingResultRef.current;
    if (!result) return;

    setSpinLoading(false);
    showResultModal(result, true);
    void uploadScreenshotSilently(result);
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();

    if (!dobOk) {
      setError("Ngày sinh phải đúng 8 số dạng ddmmyyyy.");
      return;
    }

    setError(null);
    setSpinResult(null);
    setModalOpen(false);
    setShowConfetti(false);
    setWinningGiftName(null);
    setSpinSeed(null);
    setWheelSpinning(false);
    pendingResultRef.current = null;
    setSpinLoading(true);

    try {
      const priorRes = await fetch(
        `/api/spin/by-dob?dob=${encodeURIComponent(dob)}`,
      );
      const priorData = (await priorRes.json()) as
        | { ok: true; alreadySpun: false }
        | {
            ok: true;
            alreadySpun: true;
            result: SpinResult;
          }
        | { ok: false; error: string };

      if (!priorRes.ok || !priorData.ok) {
        setError(priorData.ok ? "Lỗi kiểm tra." : priorData.error);
        return;
      }

      if (priorData.alreadySpun) {
        showResultModal({ ...priorData.result, alreadySpun: true }, false);
        return;
      }

      const eligibleRes = await fetch(
        `/api/gifts/eligible?dob=${encodeURIComponent(dob)}`,
      );
      const eligibleData = (await eligibleRes.json()) as
        | { ok: true; gifts: GiftSegment[] }
        | { ok: false; error: string };

      if (!eligibleRes.ok || !eligibleData.ok) {
        throw new Error(eligibleData.ok ? "Unknown error" : eligibleData.error);
      }

      if (eligibleData.gifts.length === 0) {
        setError("Hết quà phù hợp giới tính.");
        return;
      }

      // Wheel keeps showing ALL gifts; server only picks gender-matched prizes.

      const spinRes = await fetch("/api/spin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ dob }),
      });
      const spinData = (await spinRes.json()) as
        | { ok: true; result: { spinId: string; childName: string; giftName: string } }
        | { ok: false; error: string };

      if (!spinRes.ok || !spinData.ok) {
        throw new Error(spinData.ok ? "Unknown error" : spinData.error);
      }

      const giftName = spinData.result.giftName.trim();
      const won =
        wheelGifts.find((g) => g.name.trim() === giftName) ??
        eligibleData.gifts.find((g) => g.name.trim() === giftName);

      if (!won) {
        throw new Error("Quà trúng không có trên vòng quay. Thử tải lại trang.");
      }

      pendingResultRef.current = {
        spinId: spinData.result.spinId,
        childName: spinData.result.childName,
        giftName,
        giftImageUrl: won.imageUrl ?? null,
        alreadySpun: false,
      };

      setWinningGiftName(giftName);
      setSpinSeed(spinData.result.spinId);
      setWheelSpinning(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Quay thất bại.");
      setWheelSpinning(false);
    } finally {
      if (!pendingResultRef.current) {
        setSpinLoading(false);
      }
    }
  }

  return (
    <Box ref={captureAllRef} sx={{ position: "relative" }}>
      <KidBackground />
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

      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          py: { xs: 2, sm: 3, md: 4 },
          px: { xs: 2, sm: 3 },
          boxSizing: "border-box",
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: 560,
            mx: "auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: { xs: 2, md: 3 },
          }}
        >
          <Box sx={{ textAlign: "center", width: "100%" }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                fontSize: { xs: "1.75rem", sm: "2.25rem", md: "2.75rem" },
                background: "linear-gradient(90deg, #FF6B9D, #6BCBFF)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              🎁 Mở quà 1/6
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mt: 1, fontSize: { xs: "0.95rem", md: "1.1rem" } }}
            >
              Nhập ngày sinh rồi bấm quay nhé!
            </Typography>
          </Box>

          <Card sx={{ width: "100%", bgcolor: "rgba(255,255,255,0.95)" }}>
            <CardContent
              sx={{
                py: { xs: 2, md: 3 },
                px: { xs: 1, sm: 2 },
                display: "flex",
                justifyContent: "center",
              }}
            >
              {wheelLoading ? (
                <CircularProgress color="primary" />
              ) : wheelGifts.length > 0 ? (
                <SpinWheel
                  segments={wheelGifts}
                  spinning={wheelSpinning}
                  winningGiftName={winningGiftName}
                  spinSeed={spinSeed}
                  resetKey={wheelResetKey}
                  onSettled={onWheelSettled}
                />
              ) : (
                <Typography color="text.secondary">Chưa có quà 🎁</Typography>
              )}
            </CardContent>
          </Card>

          <Card
            component="form"
            onSubmit={handleSubmit}
            sx={{
              width: "100%",
              bgcolor: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(8px)",
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Stack spacing={2}>
                <TextField
                  label="Ngày sinh (Ví dụ: 02062018)"
                  value={dob}
                  onChange={(e) => onDobChange(e.target.value)}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="Ví dụ: 02062018"
                  error={Boolean(error) && !spinLoading}
                  helperText="Nhập 8 số rồi bấm Quay — ví dụ: 02062018"
                  disabled={spinLoading}
                  fullWidth
                />

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  fullWidth
                  disabled={!dobOk || spinLoading}
                  sx={{ py: 1.5, fontSize: { xs: "1rem", md: "1.15rem" } }}
                >
                  {spinLoading ? (
                    <Box
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <CircularProgress size={22} color="inherit" />
                      <span>
                        {wheelSpinning ? "Đang quay..." : "Đang kiểm tra..."}
                      </span>
                    </Box>
                  ) : (
                    "🎡 Quay quà!"
                  )}
                </Button>

              </Stack>
            </CardContent>
          </Card>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ textAlign: "center", pb: 2 }}
          >
            Mỗi bé chỉ quay 1 lần thôi nhé! 💝
          </Typography>
        </Box>
      </Box>

      <WinModal
        open={modalOpen}
        result={spinResult}
        onConfirm={resetAll}
      />
    </Box>
  );
}
