export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPin, verifyPin } from "@/lib/crypto";

// currentPin is required once a PIN already exists — this prevents a
// stolen access token (15-min lifetime, but still) from being used to
// silently take over the wallet by just resetting the PIN.
const schema = z.object({
  newPin: z.string().length(4).regex(/^\d{4}$/, "PIN must be exactly 4 digits"),
  currentPin: z.string().length(4).optional(),
});

export async function POST(req: NextRequest) {
  const auth = await getAuthUser(req);
  if (!auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = schema.parse(await req.json());
    const { user } = auth;

    if (user.pinHash) {
      if (!body.currentPin) {
        return NextResponse.json({ error: "currentPin is required to change an existing PIN" }, { status: 400 });
      }
      const ok = await verifyPin(body.currentPin, user.pinHash);
      if (!ok) return NextResponse.json({ error: "Incorrect current PIN" }, { status: 401 });
    }

    const newHash = await hashPin(body.newPin);
    await prisma.user.update({ where: { id: user.id }, data: { pinHash: newHash } });

    return NextResponse.json({ success: true });
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
