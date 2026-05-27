import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const dob = (url.searchParams.get("dob") ?? "").trim();

  if (!/^\d{8}$/.test(dob)) {
    return NextResponse.json(
      { ok: false, error: "Invalid dob. Expected ddmmyyyy (8 digits)." },
      { status: 400 },
    );
  }

  const sb = supabaseAdmin();

  const { data: child, error: childError } = await sb
    .from("children")
    .select("id,name")
    .eq("dob", dob)
    .maybeSingle();

  if (childError) {
    return NextResponse.json(
      { ok: false, error: childError.message },
      { status: 500 },
    );
  }
  if (!child) {
    return NextResponse.json(
      { ok: false, error: "Sai ngày sinh,vui lòng nhập lại !" },
      { status: 404 },
    );
  }

  const { data: spin, error: spinError } = await sb
    .from("spins")
    .select("id, gift:gifts(name, image_url)")
    .eq("child_id", child.id)
    .maybeSingle();

  if (spinError) {
    return NextResponse.json(
      { ok: false, error: spinError.message },
      { status: 500 },
    );
  }

  if (!spin) {
    return NextResponse.json({ ok: true, alreadySpun: false });
  }

  const gift = spin.gift as { name: string; image_url: string | null } | null;

  return NextResponse.json({
    ok: true,
    alreadySpun: true,
    result: {
      spinId: spin.id as string,
      childName: child.name as string,
      giftName: gift?.name ?? "",
      giftImageUrl: gift?.image_url?.trim() || null,
    },
  });
}
