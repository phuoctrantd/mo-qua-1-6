import { NextResponse } from "next/server";
import { normalizeSpinRpc } from "@/lib/spin-result";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { dob?: unknown }
    | null;
  const dob = typeof body?.dob === "string" ? body.dob.trim() : "";

  if (!/^\d{8}$/.test(dob)) {
    return NextResponse.json(
      { ok: false, error: "Invalid dob. Expected ddmmyyyy (8 digits)." },
      { status: 400 },
    );
  }

  const sb = supabaseAdmin();
  const { data, error } = await sb.rpc("spin_for_dob", { p_dob: dob });

  if (error) {
    // Friendly mapping for common cases
    const msg = error.message.toLowerCase();
    if (msg.includes("already_spun")) {
      return NextResponse.json(
        { ok: false, error: "Cháu này đã quay rồi (mỗi cháu chỉ 1 lần)." },
        { status: 409 },
      );
    }
    if (msg.includes("child_not_found")) {
      return NextResponse.json(
        { ok: false, error: "Sai ngày sinh,vui lòng nhập lại !" },
        { status: 404 },
      );
    }
    if (msg.includes("child_missing_gender")) {
      return NextResponse.json(
        { ok: false, error: "Cháu chưa có giới tính trong dữ liệu. Import lại file Excel." },
        { status: 409 },
      );
    }
    if (msg.includes("out_of_gifts")) {
      return NextResponse.json(
        {
          ok: false,
          error: "Hết quà phù hợp giới tính (hoặc không còn số lượng).",
        },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 },
    );
  }

  const row = normalizeSpinRpc(data);
  if (!row) {
    return NextResponse.json(
      { ok: false, error: "Invalid spin response from database." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    result: {
      spinId: row.spin_id,
      childName: row.child_name,
      giftName: row.gift_name,
    },
  });
}

