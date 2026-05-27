import type { SupabaseClient } from "@supabase/supabase-js";

const SCREENSHOT_BUCKET = "screenshots";
/** 1 year — enough for admin review; regenerate if needed. */
const SIGNED_URL_TTL_SEC = 60 * 60 * 24 * 365;

export function getScreenshotPublicUrl(
  supabaseUrl: string,
  objectPath: string,
): string {
  const base = supabaseUrl.replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${SCREENSHOT_BUCKET}/${objectPath}`;
}

export async function getScreenshotSignedUrl(
  sb: SupabaseClient,
  objectPath: string,
): Promise<string | null> {
  const { data, error } = await sb.storage
    .from(SCREENSHOT_BUCKET)
    .createSignedUrl(objectPath, SIGNED_URL_TTL_SEC);

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
