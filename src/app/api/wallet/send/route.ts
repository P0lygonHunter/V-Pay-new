export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth";
import { store } from "@/lib/store";
import { generateId, generateReference, verifyPin } from "@/lib/crypto";
import { Transaction } from "@/lib/types";

const schema = z.object({
  to: z.string().min(3),
  amount: z.number().positive().max(1_000_000),
  note: z.string().max(200).optional(),
  pin: z.string().length(4).optional(),
});

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = schema.parse(await req.json());
    const user = auth.user;

    if (user.balance < body.amount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    if (body.pin && user.pinHash) {
      const ok = await verifyPin(body.pin, user.pinHash);
      if (!ok) return NextResponse.json({ error: "Incorrect PIN" }, { status: 401 });
    }

    store.updateBalance(user.id, user.balance - body.amount);

    const tx: Transaction = {
      id: generateId("tx"),
      userId: user.id,
      type: "sent",
      title: `Sent to ${body.to}`,
      amount: body.amount,
      currency: "PKR",
      status: "completed",
      note: body.note,
      counterparty: body.to,
      reference: generateReference(),
      createdAt: new Date().toISOString(),
    };
    store.addTransaction(tx);

    return NextResponse.json({ success: true, transaction: tx });
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
