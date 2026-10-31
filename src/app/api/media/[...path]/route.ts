import fs from "node:fs";
import path from "node:path";
import { getStorageDirectory } from "@/lib/r2-media";

export const runtime = "nodejs";

const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml; charset=utf-8",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;
  if (!segments || segments.length === 0) {
    return new Response("Not Found", { status: 404 });
  }

  // Prevent directory traversal attacks
  for (const segment of segments) {
    if (segment === ".." || segment.includes("/") || segment.includes("\\")) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  const storageDir = getStorageDirectory();
  const fullPath = path.resolve(storageDir, ...segments);

  // Ensure fullPath is strictly inside storageDir
  if (!fullPath.startsWith(path.resolve(storageDir))) {
    return new Response("Forbidden", { status: 403 });
  }

  try {
    const stat = await fs.promises.stat(fullPath);
    if (!stat.isFile()) {
      return new Response("Not Found", { status: 404 });
    }

    const ext = path.extname(fullPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    const data = await fs.promises.readFile(fullPath);

    return new Response(data, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(stat.size),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not Found", { status: 404 });
  }
}
