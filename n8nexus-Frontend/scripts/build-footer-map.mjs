import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = fs.readFileSync(path.join(root, "public/footer-world-map-base.svg"), "utf8");

const defs = `<defs>
  <pattern id="footerDots" width="6" height="6" patternUnits="userSpaceOnUse">
    <circle cx="3" cy="3" r="1.25" fill="#FF6A00" fill-opacity="0.85"/>
  </pattern>
</defs>`;

let out = src.replace(
  /<\/desc>\s*<g>/,
  `</desc>\n${defs}\n<g fill="url(#footerDots)" stroke="none">`,
);

out = out.replace(/(<path[^>]*?)\s+fill="[^"]*"/g, "$1");
out = out.replace(/(<path[^>]*?)\s+stroke="[^"]*"/g, "$1");

const outPath = path.join(root, "public/footer-world-map.svg");
fs.writeFileSync(outPath, out);
console.log("written", fs.statSync(outPath).size);
