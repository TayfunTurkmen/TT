import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const standaloneDir = path.join(root, ".next", "standalone");

if (fs.existsSync(standaloneDir)) {
  const publicSrc = path.join(root, "public");
  const publicDest = path.join(standaloneDir, "public");
  if (fs.existsSync(publicSrc)) {
    fs.cpSync(publicSrc, publicDest, { recursive: true });
  }

  const staticSrc = path.join(root, ".next", "static");
  const staticDest = path.join(standaloneDir, ".next", "static");
  if (fs.existsSync(staticSrc)) {
    fs.cpSync(staticSrc, staticDest, { recursive: true });
  }

  // Next.js standalone tracer can miss the esm/ subfolder in @swc/helpers
  const swcSrc = path.join(root, "node_modules", "@swc", "helpers");
  const swcDest = path.join(standaloneDir, "node_modules", "@swc", "helpers");
  if (fs.existsSync(swcSrc)) {
    fs.cpSync(swcSrc, swcDest, { recursive: true });
  }

  console.log("Copied standalone static assets and @swc/helpers successfully.");
}
