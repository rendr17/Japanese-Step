import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const src = path.join(root, "node_modules", "kuromoji", "dict");
const dest = path.join(root, "public", "dict");

if (!fs.existsSync(src)) {
  console.warn("kuromoji dict not found, skipping copy");
  process.exit(0);
}

fs.mkdirSync(dest, { recursive: true });
for (const file of fs.readdirSync(src)) {
  fs.copyFileSync(path.join(src, file), path.join(dest, file));
}
console.log(`Copied kuromoji dict to ${dest}`);
