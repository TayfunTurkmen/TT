import { getMediaEnv, publicMediaUrl } from "@/lib/r2-media";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const SAFE_NAME_PATTERN = /[^a-z0-9._-]+/g;

function safeFileName(name: string) {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(SAFE_NAME_PATTERN, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
  return base || "upload";
}

export async function POST(request: Request) {
  const jar = await cookies();
  if (jar.get("admin_ok")?.value !== "1") {
    return NextResponse.json({ ok: false, error: "locked" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }
  if (!file.type.startsWith("image/") || file.size < 1 || file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 400 });
  }

  const { bucket, publicBaseUrl } = getMediaEnv();
  if (!bucket) {
    return NextResponse.json({ ok: false, error: "storage" }, { status: 503 });
  }

  const key = `media/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
  await bucket.put(key, await file.arrayBuffer(), {
    httpMetadata: {
      contentType: file.type,
    },
    customMetadata: {
      originalName: file.name.slice(0, 120),
    },
  });

  return NextResponse.json({
    ok: true,
    key,
    url: publicMediaUrl(key, publicBaseUrl),
  });
}
