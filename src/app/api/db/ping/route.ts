import { NextResponse } from "next/server";
import { pingD1 } from "@/lib/d1";

export const runtime = "nodejs";

export async function GET() {
  const now = await pingD1();

  if (!now) {
    return NextResponse.json(
      {
        connected: false,
        error: "D1 binding (BLOG_DB) not found in Cloudflare env.",
      },
      { status: 503 },
    );
  }

  return NextResponse.json({ connected: true, now });
}
