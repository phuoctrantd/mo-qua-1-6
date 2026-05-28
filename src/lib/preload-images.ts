function loadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = src;
  });
}

const cache = new Map<string, Promise<void>>();

export function preloadImages(urls: readonly string[]): Promise<void> {
  const key = urls.join("|");
  const existing = cache.get(key);
  if (existing) return existing;

  const promise = Promise.all(urls.map(loadImage)).then(() => undefined);
  cache.set(key, promise);
  return promise;
}

const DOB_ASSETS = ["/bg_dob.png"] as const;
const BAG_ASSETS = ["/bg_bag.png", "/image_button.png"] as const;
const RESULT_ASSETS = ["/bg_bag.png", "/bg_result.png"] as const;

export function preloadDobScreen(): Promise<void> {
  return preloadImages(DOB_ASSETS);
}

export function preloadBagScreen(): Promise<void> {
  return preloadImages(BAG_ASSETS);
}

export function preloadResultAssets(): Promise<void> {
  return preloadImages(RESULT_ASSETS);
}
