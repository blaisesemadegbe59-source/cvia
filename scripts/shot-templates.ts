import { chromium } from "playwright";
import fs from "node:fs";
import { sampleContent, defaultStyle } from "../src/lib/cv-schema";
import { renderDocumentHtml, TEMPLATE_DEFS } from "../src/lib/templates/templates";
import { fontCssInline } from "../src/lib/templates/fonts-inline";

// "server-only" est neutralisé hors Next
(async () => {
  fs.mkdirSync("/tmp/shots", { recursive: true });
  const b = await chromium.launch();
  const accents: Record<string,string> = { classique: "#0B6B4F", moderne: "#1D4ED8", "jeune-diplome": "#9D174D", technique: "#0F766E", sobre: "#334155" };
  const fonts: Record<string,string> = { classique: "Merriweather", moderne: "Poppins", "jeune-diplome": "Inter", technique: "Montserrat", sobre: "Lato" };
  for (const t of TEMPLATE_DEFS) {
    const style = { ...defaultStyle(), accent: accents[t.slug], font: fonts[t.slug] as any };
    const html = renderDocumentHtml(t.slug, { content: sampleContent(), style, lang: "fr", photoUrl: null, watermark: t.slug==="sobre", fontCss: fontCssInline(style.font), brand: "Cvia" });
    fs.writeFileSync(`/tmp/shots/${t.slug}.html`, html);
    const p = await b.newPage({ viewport: { width: 794, height: 1123 } });
    await p.setContent(html);
    await p.screenshot({ path: `/tmp/shots/${t.slug}.png`, fullPage: true });
    await p.pdf({ path: `/tmp/shots/${t.slug}.pdf`, preferCSSPageSize: true, printBackground: true });
    console.log(t.slug, "ok");
  }
  await b.close();
})();
