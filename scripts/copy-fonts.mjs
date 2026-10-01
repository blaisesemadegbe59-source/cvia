// Copie les polices (woff2, sous-ensemble latin) vers public/fonts pour l'aperçu navigateur.
import fs from "node:fs";
import path from "node:path";

const fonts = ["inter", "lato", "poppins", "montserrat", "open-sans", "merriweather"];
const weights = [400, 700];
const out = path.join(process.cwd(), "public", "fonts");
fs.mkdirSync(out, { recursive: true });
for (const f of fonts) {
  for (const w of weights) {
    const src = path.join(process.cwd(), "node_modules", "@fontsource", f, "files", `${f}-latin-${w}-normal.woff2`);
    if (!fs.existsSync(src)) { console.warn("manquant:", src); continue; }
    fs.copyFileSync(src, path.join(out, `${f}-${w}.woff2`));
  }
}
console.log("polices copiées dans public/fonts");
