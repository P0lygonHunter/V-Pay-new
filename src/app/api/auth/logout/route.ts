export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { store } from "@/lib/store";

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json().catch(() => ({}));
    if (body.refreshToken) store.revokeRefreshToken(body.refreshToken);
  } catch {}
  return NextResponse.json({ success: true });
}
