export const runtime = "nodejs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { store } from "@/lib/store";
import { generateOtp } from "@/lib/crypto";

const schema = z.object({
  phone: z.string().min(10).max(15),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone } = schema.parse(body);
    const normalized = phone.startsWith("+") ? phone : `+92${phone.replace(/^0/, "")}`;

    const code =
      process.env.DEMO_OTP_ENABLED !== "false"
        ? process.env.DEMO_OTP_CODE || "123456"
        : generateOtp(6);

    await store.ready();
    store.setOtp(normalized, code);
    console.log(`[OTP] ${normalized} → ${code}`);

    return NextResponse.json({
      success: true,
      message: "OTP sent",
      ...(process.env.DEMO_OTP_ENABLED !== "false" ? { demoOtp: code } : {}),
    });
  } catch (err: any) {
    if (err.name === "ZodError") {
      return NextResponse.json({ error: "Validation failed", details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
