import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isBeforeLaunch } from "@/lib/launch";

export function middleware(request: NextRequest) {
  if (!isBeforeLaunch()) return NextResponse.next();

  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json(
      { ok: false, error: "Chưa đến giờ mở cửa." },
      { status: 503 },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
