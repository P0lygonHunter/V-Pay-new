export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createTokens } from "@/lib/jwt";
import { verifyOtpHash } from "@/lib/crypto";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  phone: z.string().min(10).max(15),
  otp: z.string().length(6),
});

const MAX_ATTEMPTS = 5;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, otp } = schema.parse(body);
    const normalized = phone.startsWith("+") ? phone : `+92${phone.replace(/^0/, "")}`;

    const limit = await rateLimit.otpVerify(normalized);
    if (!limit.success) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }

    const challenge = await prisma.otpChallenge.findUnique({ where: { phone: normalized } });
    if (!challenge || challenge.expiresAt < new Date()) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 401 });
    }
    if (challenge.attempts >= MAX_ATTEMPTS) {
      await prisma.otpChallenge.delete({ where: { phone: normalized } });
      return NextResponse.json({ error: "Too many attempts. Request a new OTP." }, { status: 401 });
    }

    const ok = await verifyOtpHash(otp, challenge.codeHash);
    if (!ok) {
      await prisma.otpChallenge.update({
        where: { phone: normalized },
        data: { attempts: { increment: 1 } },
      });
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 401 });
    }

    await prisma.otpChallenge.delete({ where: { phone: normalized } });

    let user = await prisma.user.findUnique({ where: { phone: normalized } });
    if (!user) {
      // accountNumber is @unique; a random 9-digit collision is very
      // unlikely but not impossible, so retry a few times on conflict
      // instead of letting a 1-in-900-million fluke 500 the signup.
      const MAX_ACCOUNT_NUMBER_RETRIES = 5;
      let lastError: unknown;
      for (let i = 0; i < MAX_ACCOUNT_NUMBER_RETRIES; i++) {
        try {
          user = await prisma.user.create({
            data: {
              phone: normalized,
              name: "User",
              accountNumber: `03${Math.floor(100000000 + Math.random() * 900000000)}`,
              balance: 0,
              currency: "PKR",
              pinHash: null,
              isVerified: false,
            },
          });
          lastError = null;
          break;
        } catch (createErr) {
          lastError = createErr;
        }
      }
      if (!user) throw lastError;
    }

    const tokens = await createTokens(user.id, user.phone);
    await prisma.refreshToken.create({
      data: {
        token: tokens.refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        accountNumber: user.accountNumber,
        isVerified: user.isVerified,
        hasPin: !!user.pinHash,
      },
      ...tokens,
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
