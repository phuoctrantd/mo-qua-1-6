function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isImageVisible(img: HTMLImageElement): boolean {
  const style = window.getComputedStyle(img);
  if (style.display === "none" || style.visibility === "hidden") return false;
  const opacity = Number.parseFloat(style.opacity);
  if (!Number.isNaN(opacity) && opacity < 0.05) return false;
  return img.complete && img.naturalWidth > 0;
}

/** Wait until all visible images inside the capture root are loaded. */
export async function waitForCaptureReady(
  root: HTMLElement | null,
  timeoutMs = 10_000,
): Promise<boolean> {
  if (!root) return false;

  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const imgs = Array.from(root.querySelectorAll("img"));
    if (imgs.length > 0 && imgs.every(isImageVisible)) return true;
    await sleep(80);
  }
  return false;
}
