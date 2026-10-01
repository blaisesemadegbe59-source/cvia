import type { FontName } from "../cv-schema";

export const fontSlug = (f: FontName | string) => f.toLowerCase().replace(/\s+/g, "-");

/** CSS @font-face pointant vers /fonts (aperçu navigateur). */
export function fontCssUrl(font: FontName | string): string {
  const s = fontSlug(font);
  return [400, 700]
    .map((w) => `@font-face{font-family:'${font}';font-weight:${w};font-style:normal;font-display:swap;src:url(/fonts/${s}-${w}.woff2) format('woff2')}`)
    .join("");
}
