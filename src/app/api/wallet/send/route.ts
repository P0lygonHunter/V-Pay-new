export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth";
import { verifyPin } from "@/lib/crypto";
import { sendMoney, InsufficientBalanceError, UserNotFoundError } from "@/lib/money";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  to: z.string().min(3),
  amount: z.number().positive().max(1_000_000),
  note: z.string().max(200).optional(),
  pin: z.string().length(4),
  idempotencyKey: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = schema.parse(await req.json());
    const { user } = auth;

    const limit = await rateLimit.send(user.id);
    if (!limit.success) {
      return NextResponse.json({ error: "Too many send attempts. Slow down." }, { status: 429 });
    }

    // PIN is now mandatory, not optional-if-present. A user with no PIN
    // set yet cannot send money at all until they call /api/wallet/set-pin.
    if (!user.pinHash) {
      return NextResponse.json(
        { error: "Set a PIN before sending money", code: "PIN_NOT_SET" },
        { status: 403 }
      );
    }
    const pinOk = await verifyPin(body.pin, user.pinHash);
    if (!pinOk) return NextResponse.json({ error: "Incorrect PIN" }, { status: 401 });

    const transaction = await sendMoney({
      senderId: user.id,
      toAccountNumberOrPhone: body.to,
      amount: body.amount,
      note: body.note,
      idempotencyKey: body.idempotencyKey,
    });

    return NextResponse.json({ success: true, transaction });
  } catch (err: unknown) {
    if (err instanceof InsufficientBalanceError) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }
    if (err instanceof UserNotFoundError) {
      return NextResponse.json({ error: "Sender account not found" }, { status: 404 });
    }
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
