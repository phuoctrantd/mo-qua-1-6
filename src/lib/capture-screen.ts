import * as htmlToImage from "html-to-image";

async function waitForImages(root: HTMLElement) {
  const imgs = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    imgs.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }
          img.onload = () => resolve();
          img.onerror = () => resolve();
        }),
    ),
  );
}

async function inlineImageSources(root: HTMLElement) {
  const imgs = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    imgs.map(async (img) => {
      const src = img.getAttribute("src");
      if (!src || src.startsWith("data:")) return;
      try {
        const res = await fetch(src, { cache: "no-store" });
        if (!res.ok) return;
        const blob = await res.blob();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        img.src = dataUrl;
        img.style.opacity = "1";
        if (img.decode) await img.decode();
      } catch {
        // Keep original src if inlining fails.
      }
    }),
  );
}

function prepareCloneForCapture(clone: HTMLElement, sourceRect: DOMRect) {
  clone.style.position = "fixed";
  clone.style.left = "-20000px";
  clone.style.top = "0";
  clone.style.width = `${sourceRect.width}px`;
  clone.style.height = `${sourceRect.height}px`;
  clone.style.zIndex = "-1";
  clone.style.pointerEvents = "none";
  clone.style.opacity = "1";

  clone.querySelectorAll("[data-capture-ignore='true']").forEach((el) => {
    el.remove();
  });

  clone.querySelectorAll("img").forEach((el) => {
    const img = el as HTMLImageElement;
    img.style.mixBlendMode = "normal";
    img.style.opacity = "1";
  });

  clone.querySelectorAll("*").forEach((el) => {
    if (!(el instanceof HTMLElement)) return;
    if (el.style.opacity === "0") el.style.opacity = "1";
  });
}

/** Clone node off-screen, inline images, then export PNG (works with html-to-image). */
export async function captureScreenPng(
  node: HTMLElement,
  backgroundColor = "#87CEEB",
): Promise<string> {
  const rect = node.getBoundingClientRect();
  const clone = node.cloneNode(true) as HTMLElement;
  prepareCloneForCapture(clone, rect);

  document.body.appendChild(clone);
  try {
    await waitForImages(clone);
    await inlineImageSources(clone);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

    return await htmlToImage.toPng(clone, {
      pixelRatio: Math.min(2, window.devicePixelRatio || 2),
      backgroundColor,
      cacheBust: true,
      skipFonts: true,
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    });
  } finally {
    document.body.removeChild(clone);
  }
}
