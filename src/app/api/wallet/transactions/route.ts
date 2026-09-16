import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { store } from "@/lib/store";

export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const type = req.nextUrl.searchParams.get("type") || "all";
  const list = store.getTransactions(auth.userId, type);
  return NextResponse.json({ transactions: list });
}
