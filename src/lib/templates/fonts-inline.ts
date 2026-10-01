import "server-only";
import fs from "node:fs";
import path from "node:path";
import { fontSlug } from "./fonts-url";

const cache = new Map<string, string>();

/** CSS @font-face avec polices incorporées en base64 (rendu PDF autonome, sans réseau). */
export function fontCssInline(font: string): string {
  const hit = cache.get(font);
  if (hit) return hit;
  const s = fontSlug(font);
  const css = [400, 700]
    .map((w) => {
      const file = path.join(process.cwd(), "public", "fonts", `${s}-${w}.woff2`);
      const b64 = fs.readFileSync(file).toString("base64");
      return `@font-face{font-family:'${font}';font-weight:${w};font-style:normal;src:url(data:font/woff2;base64,${b64}) format('woff2')}`;
    })
    .join("");
  cache.set(font, css);
  return css;
}
