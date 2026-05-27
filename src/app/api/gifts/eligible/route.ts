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
    .select("id,name,gender")
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
  if (!child.gender) {
    return NextResponse.json(
      { ok: false, error: "Cháu chưa có giới tính trong dữ liệu." },
      { status: 409 },
    );
  }

  const { data: gifts, error: giftsError } = await sb
    .from("gifts")
    .select("name, image_url")
    .gt("quantity_remaining", 0)
    .or(`gender.eq.${child.gender},gender.eq.unisex`)
    .order("name");

  if (giftsError) {
    const missingImageCol = giftsError.message
      .toLowerCase()
      .includes("image_url");
    if (missingImageCol) {
      const fallback = await sb
        .from("gifts")
        .select("name")
        .gt("quantity_remaining", 0)
        .or(`gender.eq.${child.gender},gender.eq.unisex`)
        .order("name");
      if (fallback.error) {
        return NextResponse.json(
          { ok: false, error: fallback.error.message },
          { status: 500 },
        );
      }
      const list = (fallback.data ?? []).map((g) => ({
        name: g.name as string,
        imageUrl: null as string | null,
      }));
      if (list.length === 0) {
        return NextResponse.json(
          { ok: false, error: "Hết quà phù hợp giới tính." },
          { status: 409 },
        );
      }
      return NextResponse.json({
        ok: true,
        child: { name: child.name, gender: child.gender },
        gifts: list,
      });
    }
    return NextResponse.json(
      { ok: false, error: giftsError.message },
      { status: 500 },
    );
  }

  const list = (gifts ?? []).map((g) => ({
    name: g.name as string,
    imageUrl: (g.image_url as string | null)?.trim() || null,
  }));

  if (list.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Hết quà phù hợp giới tính." },
      { status: 409 },
    );
  }

  return NextResponse.json({
    ok: true,
    child: { name: child.name, gender: child.gender },
    gifts: list,
  });
}
