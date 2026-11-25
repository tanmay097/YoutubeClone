// Uploads assets/icons/*.svg to ImageKit under /vidora/icons (overwriting existing files).
// Usage: npm run seed:icons   (reads apps/web/.env.local)
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.resolve(here, "../../../assets/icons");
const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
if (!privateKey) {
  console.error("IMAGEKIT_PRIVATE_KEY missing in apps/web/.env.local");
  process.exit(1);
}
const auth = "Basic " + Buffer.from(`${privateKey}:`).toString("base64");

const files = fs.readdirSync(iconsDir).filter((f) => f.endsWith(".svg"));
for (const name of files) {
  const form = new FormData();
  form.append("file", new Blob([fs.readFileSync(path.join(iconsDir, name))], { type: "image/svg+xml" }), name);
  form.append("fileName", name);
  form.append("folder", "/vidora/icons");
  form.append("useUniqueFileName", "false");
  form.append("overwriteFile", "true");
  const res = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
    method: "POST",
    headers: { Authorization: auth },
    body: form,
  });
  const body = await res.json();
  if (!res.ok) {
    console.error(`✗ ${name}: ${body.message ?? res.status}`);
    process.exitCode = 1;
  } else {
    console.log(`✓ ${name} → ${body.url}`);
  }
}
