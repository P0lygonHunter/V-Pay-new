export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      service: "vortex-wallet-api",
      database: "connected",
      time: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Health check DB failure:", err);
    return NextResponse.json(
      {
        status: "degraded",
        service: "vortex-wallet-api",
        database: "unreachable",
        time: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
