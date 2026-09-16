import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import { createTokens, verifyRefreshToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    const { refreshToken } = await req.json();
    if (!refreshToken || !store.hasRefreshToken(refreshToken)) {
      return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
    }
    const payload = await verifyRefreshToken(refreshToken);
    const tokens = await createTokens(payload.sub, payload.phone);
    store.revokeRefreshToken(refreshToken);
    store.addRefreshToken(tokens.refreshToken);
    return NextResponse.json(tokens);
  } catch {
    return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
  }
}
