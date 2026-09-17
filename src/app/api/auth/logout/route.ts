export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json().catch(() => ({}));
    if (body.refreshToken) {
      await prisma.refreshToken.updateMany({
        where: { token: body.refreshToken, userId: auth.userId },
        data: { revoked: true },
      });
    }
  } catch {}
  return NextResponse.json({ success: true });
}
