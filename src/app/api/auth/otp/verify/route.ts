import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { store } from "@/lib/store";
import { createTokens } from "@/lib/jwt";
import { generateId } from "@/lib/crypto";

const schema = z.object({
  phone: z.string().min(10).max(15),
  otp: z.string().length(6),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, otp } = schema.parse(body);
    const normalized = phone.startsWith("+") ? phone : `+92${phone.replace(/^0/, "")}`;

    if (!store.verifyOtp(normalized, otp)) {
      return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 401 });
    }

    let user = store.getUserByPhone(normalized);
    if (!user) {
      user = {
        id: generateId("user"),
        phone: normalized,
        name: "User",
        accountNumber: `03${Math.floor(100000000 + Math.random() * 900000000)}`,
        balance: 0,
        currency: "PKR",
        pinHash: null,
        createdAt: new Date().toISOString(),
        isVerified: false,
      };
      store.saveUser(user);
    }

    const tokens = await createTokens(user.id, user.phone);
    store.addRefreshToken(tokens.refreshToken);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        accountNumber: user.accountNumber,
        isVerified: user.isVerified,
      },
      ...tokens,
    });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
