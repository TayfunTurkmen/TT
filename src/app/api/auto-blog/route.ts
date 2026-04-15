import { generateDraft } from "@/lib/auto-blog";
import { logAutoBlogRun } from "@/lib/d1";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type Body = {
  topic?: string;
  locale?: string;
};

export async function POST(request: Request) {
  const expected = process.env.AUTO_BLOG_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: "AUTO_BLOG_SECRET is not configured." },
      { status: 503 },
    );
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const topic = String(body.topic ?? "").trim();
  const locale = body.locale === "tr" ? "tr" : "en";
  if (topic.length < 3) {
    return NextResponse.json({ error: "Topic is too short." }, { status: 400 });
  }

  const draft = await generateDraft({ topic, locale });
  try {
    await logAutoBlogRun(topic, locale);
  } catch {
    // D1 should not block draft generation.
  }
  return NextResponse.json(draft);
}
