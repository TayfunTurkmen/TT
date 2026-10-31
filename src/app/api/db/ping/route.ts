import { NextResponse } from "next/server";
import { pingD1 } from "@/lib/d1";

export const runtime = "nodejs";

export async function GET() {
  const now = await pingD1();

  if (!now) {
    return NextResponse.json(
      {
        connected: false,
        error: "Database (PostgreSQL or D1) not connected.",
      },
      { status: 503 },
    );
  }

  return NextResponse.json({ connected: true, now });
}
