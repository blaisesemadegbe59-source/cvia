import { chromium } from "playwright";
import fs from "node:fs";
import { sampleContent, defaultStyle } from "../src/lib/cv-schema";
import { renderDocumentHtml } from "../src/lib/templates/templates";
import { fontCssInline } from "../src/lib/templates/fonts-inline";
(async () => {
  const b = await chromium.launch();
  const c = sampleContent();
  c.experiences = [...c.experiences, ...c.experiences.map((e,i)=>({...e,id:"x"+i})), ...c.experiences.map((e,i)=>({...e,id:"y"+i}))];
  for (const slug of ["technique","jeune-diplome","moderne","classique"]) {
    const style = { ...defaultStyle(), accent: "#0F766E" };
    const html = renderDocumentHtml(slug, { content: c, style, lang: "fr", photoUrl: null, watermark: false, fontCss: fontCssInline("Inter"), brand: "Cvia" });
    const p = await b.newPage();
    await p.setContent(html);
    await p.pdf({ path: `/tmp/shots/long-${slug}.pdf`, preferCSSPageSize: true, printBackground: true });
  }
  await b.close();
})();
