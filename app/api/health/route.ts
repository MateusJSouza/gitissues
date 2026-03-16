import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/health
// Usado por cron jobs externos para manter o banco ativo (Neon auto-suspende após inatividade)
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        status: "ok",
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[health-check] Database unreachable:", error);

    return NextResponse.json(
      {
        status: "error",
        timestamp: new Date().toISOString(),
        message: "Database connection failed",
      },
      { status: 503 }
    );
  }
}
