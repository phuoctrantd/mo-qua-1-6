import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

/** All gifts in stock — for wheel display before DOB is entered. */
export async function GET() {
  const sb = supabaseAdmin();

  const { data, error } = await sb
    .from("gifts")
    .select("name, image_url")
    .gt("quantity_remaining", 0)
    .order("name");

  if (error) {
    const missingImageCol = error.message.toLowerCase().includes("image_url");
    if (missingImageCol) {
      const fallback = await sb
        .from("gifts")
        .select("name")
        .gt("quantity_remaining", 0)
        .order("name");
      if (fallback.error) {
        return NextResponse.json(
          { ok: false, error: fallback.error.message },
          { status: 500 },
        );
      }
      return NextResponse.json({
        ok: true,
        gifts: (fallback.data ?? []).map((g) => ({
          name: g.name as string,
          imageUrl: null,
        })),
      });
    }
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    gifts: (data ?? []).map((g) => ({
      name: g.name as string,
      imageUrl: (g.image_url as string | null)?.trim() || null,
    })),
  });
}
