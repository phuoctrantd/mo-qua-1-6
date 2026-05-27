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
  const { data, error } = await sb
    .from("children")
    .select("id,name,dob,gender")
    .eq("dob", dob)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 },
    );
  }
  if (!data) {
    return NextResponse.json(
      { ok: false, error: "Sai ngày sinh,vui lòng nhập lại !" },
      { status: 404 },
    );
  }

  return NextResponse.json({ ok: true, child: data });
}

