import { autoPublishScheduledPosts, logCronRun } from "@/lib/d1";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured." },
      { status: 503 },
    );
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const publishedCount = await autoPublishScheduledPosts(50);
    await logCronRun({
      source: "cron-api",
      ok: true,
      publishedCount,
      error: null,
    });
    return NextResponse.json({ ok: true, publishedCount });
  } catch (error) {
    const message = error instanceof Error ? error.message : "cron-run-failed";
    await logCronRun({
      source: "cron-api",
      ok: false,
      publishedCount: 0,
      error: message,
    });
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
