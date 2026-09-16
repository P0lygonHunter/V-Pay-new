import { NextRequest } from "next/server";
import { verifyAccessToken } from "./jwt";
import { store } from "./store";

export async function getAuthUser(req: NextRequest) {
  await store.ready();
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  try {
    const payload = await verifyAccessToken(header.slice(7));
    const user = store.getUserById(payload.sub);
    if (!user) return null;
    return { userId: payload.sub, phone: payload.phone, user };
  } catch {
    return null;
  }
}
