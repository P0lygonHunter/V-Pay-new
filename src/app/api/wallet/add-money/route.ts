export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth";
import { createPendingAddMoney } from "@/lib/money";

const schema = z.object({
  amount: z.number().positive().max(500_000),
  method: z.enum(["jazzcash", "easypaisa", "bank", "card"]),
  idempotencyKey: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = schema.parse(await req.json());
    const { user } = auth;

    // This creates a PENDING transaction only. Balance is NOT credited
    // here. Crediting happens exclusively in confirmPendingAddMoney(),
    // called from the payment gateway's webhook once it confirms the
    // charge actually succeeded. That webhook does not exist yet — this
    // is item #3, still pending real JazzCash/EasyPaisa/bank
    // credentials. Until it's wired, this endpoint will create pending
    // transactions that never complete, which is the safe failure mode
    // (compare to the old behavior: instant, unconditional balance
    // credit from an unauthenticated client-supplied amount).
    const transaction = await createPendingAddMoney({
      userId: user.id,
      amount: body.amount,
      method: body.method,
      idempotencyKey: body.idempotencyKey,
    });

    return NextResponse.json({
      success: true,
      transaction,
      message: "Payment initiated — awaiting gateway confirmation (not yet wired; see item #3)",
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
