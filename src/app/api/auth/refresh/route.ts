export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createTokens, verifyRefreshToken } from "@/lib/jwt";

export async function POST(req: NextRequest) {
  try {
    const { refreshToken } = await req.json();
    if (!refreshToken) {
      return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
    }

    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
    }

    const payload = await verifyRefreshToken(refreshToken);

    const tokens = await createTokens(payload.sub, payload.phone);

    await prisma.$transaction([
      prisma.refreshToken.update({ where: { token: refreshToken }, data: { revoked: true } }),
      prisma.refreshToken.create({
        data: {
          token: tokens.refreshToken,
          userId: payload.sub,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    return NextResponse.json(tokens);
  } catch {
    return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 });
  }
}
