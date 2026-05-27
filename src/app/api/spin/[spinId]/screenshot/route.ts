import { NextResponse } from "next/server";
import { mustGetEnv } from "@/lib/env";
import {
  getScreenshotPublicUrl,
  getScreenshotSignedUrl,
} from "@/lib/storage-url";
import { supabaseAdmin } from "@/lib/supabase-admin";

function parseDataUrlPng(dataUrl: string): Buffer {
  const m = /^data:image\/png;base64,(.+)$/.exec(dataUrl);
  if (!m) throw new Error("Invalid PNG data URL.");
  return Buffer.from(m[1], "base64");
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ spinId: string }> },
) {
  const { spinId } = await params;
  const body = (await req.json().catch(() => null)) as
    | { pngDataUrl?: unknown }
    | null;
  const pngDataUrl = typeof body?.pngDataUrl === "string" ? body.pngDataUrl : "";

  if (!spinId) {
    return NextResponse.json(
      { ok: false, error: "Missing spinId." },
      { status: 400 },
    );
  }

  let bytes: Buffer;
  try {
    bytes = parseDataUrlPng(pngDataUrl);
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Invalid image." },
      { status: 400 },
    );
  }

  const sb = supabaseAdmin();

  const objectPath = `spins/${spinId}.png`;
  const { error: uploadError } = await sb.storage
    .from("screenshots")
    .upload(objectPath, bytes, {
      contentType: "image/png",
      upsert: true,
    });

  if (uploadError) {
    return NextResponse.json(
      { ok: false, error: uploadError.message },
      { status: 500 },
    );
  }

  const supabaseUrl = mustGetEnv("SUPABASE_URL");
  let screenshotUrl =
    (await getScreenshotSignedUrl(sb, objectPath)) ??
    getScreenshotPublicUrl(supabaseUrl, objectPath);

  const fullUpdate = await sb
    .from("spins")
    .update({
      screenshot_path: objectPath,
      screenshot_url: screenshotUrl,
    })
    .eq("id", spinId);

  if (fullUpdate.error) {
    const missingUrlColumn = fullUpdate.error.message
      .toLowerCase()
      .includes("screenshot_url");

    if (!missingUrlColumn) {
      return NextResponse.json(
        { ok: false, error: fullUpdate.error.message },
        { status: 500 },
      );
    }

    const pathOnly = await sb
      .from("spins")
      .update({ screenshot_path: objectPath })
      .eq("id", spinId);

    if (pathOnly.error) {
      return NextResponse.json(
        { ok: false, error: pathOnly.error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      screenshotUrl,
      warning:
        "Chưa có cột screenshot_url. Chạy supabase/migrations/003_screenshot_url.sql trong Supabase SQL Editor.",
    });
  }

  return NextResponse.json({ ok: true, screenshotUrl });
}

