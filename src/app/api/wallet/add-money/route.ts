export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth";
import { store } from "@/lib/store";
import { generateId, generateReference } from "@/lib/crypto";
import { Transaction } from "@/lib/types";

const schema = z.object({
  amount: z.number().positive().max(500_000),
  method: z.enum(["jazzcash", "easypaisa", "bank", "card"]),
});

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = schema.parse(await req.json());
    const user = auth.user;

    // Sandbox payment simulation (replace with real JazzCash/EasyPaisa later)
    console.log(`[Payment SANDBOX] ${body.method} ${body.amount} PKR for ${user.id}`);

    store.updateBalance(user.id, user.balance + body.amount);

    const tx: Transaction = {
      id: generateId("tx"),
      userId: user.id,
      type: "add_money",
      title: `Added via ${body.method}`,
      amount: body.amount,
      currency: "PKR",
      status: "completed",
      reference: generateReference(),
      provider: body.method,
      createdAt: new Date().toISOString(),
    };
    store.addTransaction(tx);

    return NextResponse.json({
      success: true,
      transaction: tx,
      message: "Payment completed (sandbox)",
    });
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "name" in err &&
      (err as { name: string }).name === "ZodError" &&
      "errors" in err
    ) {
      const zodErr = err as { name: string; errors: unknown };
      return NextResponse.json({ error: "Validation failed", details: zodErr.errors }, { status: 400 });
    }
    console.error(err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
