export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { user } = auth;
  return NextResponse.json({
    balance: user.balance,
    currency: user.currency,
    accountNumber: user.accountNumber,
  });
}
