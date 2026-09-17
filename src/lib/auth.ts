import { NextRequest } from "next/server";
import { verifyAccessToken } from "./jwt";
import { prisma } from "./prisma";

export async function getAuthUser(req: NextRequest) {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  try {
    const payload = await verifyAccessToken(header.slice(7));
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return null;
    return { userId: payload.sub, phone: payload.phone, user };
  } catch {
    return null;
  }
}
