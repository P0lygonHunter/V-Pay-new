export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { generateOtp, hashOtp } from "@/lib/crypto";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  phone: z.string().min(10).max(15),
});

const OTP_TTL_MS = 5 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone } = schema.parse(body);
    const normalized = phone.startsWith("+") ? phone : `+92${phone.replace(/^0/, "")}`;

    const limit = await rateLimit.otpRequest(normalized);
    if (!limit.success) {
      return NextResponse.json(
        { error: "Too many OTP requests. Try again later." },
        { status: 429 }
      );
    }

    const isDemoMode = process.env.DEMO_OTP_ENABLED === "true";
    const code = isDemoMode ? process.env.DEMO_OTP_CODE || "123456" : generateOtp(6);
    const codeHash = await hashOtp(code);

    await prisma.otpChallenge.upsert({
      where: { phone: normalized },
      create: { phone: normalized, codeHash, expiresAt: new Date(Date.now() + OTP_TTL_MS), attempts: 0 },
      update: { codeHash, expiresAt: new Date(Date.now() + OTP_TTL_MS), attempts: 0 },
    });

    if (!isDemoMode) {
      // TODO (item #5, not yet wired): send `code` via a real SMS gateway
      // (Twilio or a local Pakistani aggregator) here. Until that
      // integration exists, non-demo mode generates a real random code
      // but has no way to deliver it to the user — do not flip
      // DEMO_OTP_ENABLED to false in production before this is done,
      // or logins will be impossible.
      console.log(`[OTP] SMS gateway not wired yet. Code for ${normalized}: ${code}`);
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent",
      ...(isDemoMode ? { demoOtp: code } : {}),
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
