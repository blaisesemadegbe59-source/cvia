import type { SectionKey } from "../cv-schema";
import {
  LABELS, RenderInput, contactList, esc, fmtRange, fullName, initials, orderedSections, richText, wrapDocument,
} from "./common";

/* ------------------------------------------------------------------ */
/* Icônes (SVG inline, 12px)                                           */
/* ------------------------------------------------------------------ */
const ic = (path: string) =>
  `<svg class="ic" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${path}</svg>`;
const ICONS = {
  phone: ic('<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>'),
  email: ic('<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>'),
  place: ic('<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/>'),
  link: ic('<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>'),
};

const photoImg = (i: RenderInput, size: string, extra = "") =>
  i.photoUrl && i.style.showPhoto
    ? `<img class="photo ${i.style.photoShape}" src="${esc(i.photoUrl)}" alt="" style="width:${size};height:${size};${extra}">`
    : "";

const contactRows = (i: RenderInput, cls = "ct") =>
  contactList(i.content)
    .map((c) => `<li class="${cls}">${ICONS[c.kind]}<span>${esc(c.text)}</span></li>`)
    .join("");

/* ---------- blocs d'entrées réutilisables ---------- */
const expBlock = (i: RenderInput, cls: string) =>
  i.content.experiences
    .map(
      (e) => `<article class="${cls}"><div class="row"><h3>${esc(e.title)}</h3><span class="dates">${esc(fmtRange(e.start, e.end, i.lang))}</span></div>
<div class="sub">${[e.company, e.location].filter(Boolean).map(esc).join(" · ")}</div>${e.description ? `<div class="desc">${richText(e.description)}</div>` : ""}</article>`,
    )
    .join("");

const eduBlock = (i: RenderInput, cls: string) =>
  i.content.education
    .map(
      (e) => `<article class="${cls}"><div class="row"><h3>${esc(e.degree)}</h3><span class="dates">${esc(fmtRange(e.start, e.end, i.lang))}</span></div>
<div class="sub">${[e.school, e.field, e.location].filter(Boolean).map(esc).join(" · ")}${e.honors ? ` — <em>${esc(e.honors)}</em>` : ""}</div></article>`,
    )
    .join("");

const certBlock = (i: RenderInput, cls: string) =>
  i.content.certifications
    .map((c) => `<article class="${cls}"><div class="row"><h3>${esc(c.name)}</h3><span class="dates">${esc(c.year)}</span></div><div class="sub">${esc(c.issuer)}</div></article>`)
    .join("");

const projBlock = (i: RenderInput, cls: string) =>
  i.content.projects
    .map((p) => `<article class="${cls}"><div class="row"><h3>${esc(p.title)}</h3>${p.url ? `<span class="dates">${esc(p.url)}</span>` : ""}</div>${p.description ? `<div class="desc">${richText(p.description)}</div>` : ""}</article>`)
    .join("");

const volBlock = (i: RenderInput, cls: string) =>
  i.content.volunteering
    .map((v) => `<article class="${cls}"><div class="row"><h3>${esc(v.role)}</h3><span class="dates">${esc(fmtRange(v.start, v.end, i.lang))}</span></div><div class="sub">${esc(v.organization)}</div>${v.description ? `<div class="desc">${richText(v.description)}</div>` : ""}</article>`)
    .join("");

const refBlock = (i: RenderInput, cls: string) =>
  i.content.references
    .map((r) => `<article class="${cls}"><h3>${esc(r.name)}</h3><div class="sub">${[r.title, r.organization].filter(Boolean).map(esc).join(" · ")}</div><div class="desc"><p>${esc(r.contact)}</p></div></article>`)
    .join("");

const skillChips = (i: RenderInput) =>
  `<div class="chips">${i.content.skills.map((s) => `<span class="chip">${esc(s.name)}</span>`).join("")}</div>`;
const skillDots = (i: RenderInput) =>
  `<ul class="plain">${i.content.skills
    .map((s) => `<li class="sk"><span>${esc(s.name)}</span>${s.level ? `<span class="dots">${[1, 2, 3, 4, 5].map((n) => `<i class="${n <= s.level ? "on" : ""}"></i>`).join("")}</span>` : ""}</li>`)
    .join("")}</ul>`;
const skillBars = (i: RenderInput) =>
  `<ul class="plain">${i.content.skills
    .map((s) => `<li class="bar"><span>${esc(s.name)}</span>${s.level ? `<div class="track"><div style="width:${s.level * 20}%"></div></div>` : ""}</li>`)
    .join("")}</ul>`;
const langList = (i: RenderInput) =>
  `<ul class="plain">${i.content.languages.map((l) => `<li class="lg"><b>${esc(l.name)}</b>${l.level ? `<span>${esc(l.level)}</span>` : ""}</li>`).join("")}</ul>`;
const interestList = (i: RenderInput) =>
  `<div class="chips">${i.content.interests.filter(Boolean).map((s) => `<span class="chip">${esc(s)}</span>`).join("")}</div>`;

/** Rendu générique d'une section selon le gabarit demandé. */
type Variant = { skills: (i: RenderInput) => string; cls: string };
function sectionBody(key: SectionKey, i: RenderInput, v: Variant): string {
  switch (key) {
    case "summary": return `<p class="summary">${esc(i.content.summary)}</p>`;
    case "experiences": return expBlock(i, v.cls);
    case "education": return eduBlock(i, v.cls);
    case "skills": return v.skills(i);
    case "languages": return langList(i);
    case "certifications": return certBlock(i, v.cls);
    case "projects": return projBlock(i, v.cls);
    case "volunteering": return volBlock(i, v.cls);
    case "interests": return interestList(i);
    case "references": return refBlock(i, v.cls);
  }
}
const section = (key: SectionKey, i: RenderInput, v: Variant, cls = "") =>
  `<section class="sec ${cls}" data-s="${key}"><h2>${esc(LABELS[i.lang][key])}</h2>${sectionBody(key, i, v)}</section>`;

/* CSS commun aux listes et entrées */
const COMMON_CSS = `
.sec{margin-bottom:calc(5.2mm * var(--d))}
.sec h2{font-size:1.02em}
article{margin-bottom:calc(3.4mm * var(--d))}
article:last-child{margin-bottom:0}
.row{display:flex;justify-content:space-between;align-items:baseline;gap:8px}
.row h3{font-size:1.05em;font-weight:700}
.dates{font-size:.86em;color:var(--muted);white-space:nowrap}
.sub{color:var(--muted);font-size:.95em;margin-top:.1em}
.desc{margin-top:.35em}
.desc li::marker{color:var(--accent)}
.summary{color:#2c3744}
.plain{list-style:none;padding:0}
.chips{display:flex;flex-wrap:wrap;gap:4px}
.ic{flex:none;color:var(--accent)}
.ct{display:flex;gap:7px;align-items:flex-start;margin:.35em 0;font-size:.95em}
.ct .ic{margin-top:.2em}
.lg{display:flex;flex-direction:column;margin:.35em 0}.lg span{font-size:.9em;color:var(--muted)}
.dots{display:inline-flex;gap:3px;margin-left:8px}
.dots i{width:7px;height:7px;border-radius:50%;background:var(--line);display:inline-block}
.dots i.on{background:var(--accent)}
.sk{display:flex;justify-content:space-between;align-items:center;margin:.4em 0}
.bar{margin:.55em 0}.bar .track{height:4px;border-radius:4px;background:rgba(255,255,255,.18);margin-top:3px}
.bar .track div{height:100%;border-radius:4px;background:var(--accent-mid)}
`;

/* ================================================================== */
/* 1. CLASSIQUE                                                        */
/* ================================================================== */
function classique(i: RenderInput): string {
  const v: Variant = { skills: skillChips, cls: "" };
  const keys = orderedSections(i.content, i.style);
  const contact = contactList(i.content).map((c) => esc(c.text)).join(" &nbsp;•&nbsp; ");
  const css = `${COMMON_CSS}
@page{margin:10mm 0}
.page{padding:2mm 17mm}
.head{display:flex;align-items:center;gap:6mm;padding-bottom:5mm;border-bottom:2px solid var(--accent);margin-bottom:6mm}
.head .id{flex:1}
.head h1{font-size:2.3em;font-weight:700;letter-spacing:.01em;color:var(--ink)}
.head .headline{font-size:1.2em;color:var(--accent);margin-top:.15em;font-weight:700}
.head .contact{margin-top:.55em;color:var(--muted);font-size:.92em}
.sec h2{text-transform:uppercase;letter-spacing:.14em;color:var(--accent);font-size:.92em;padding-bottom:.35em;margin-bottom:.8em;border-bottom:1px solid var(--line)}
.chip{border:1px solid var(--accent-mid);color:var(--ink);padding:1px 8px;border-radius:99px;font-size:.92em;background:var(--accent-soft)}
.lg{flex-direction:row;gap:8px;align-items:baseline}
.plain{display:flex;flex-wrap:wrap;gap:2px 22px}
`;
  const inner = `<div class="page"><header class="head">${photoImg(i, "27mm", "flex:none")}<div class="id"><h1>${esc(fullName(i.content))}</h1>${i.content.basics.headline ? `<div class="headline">${esc(i.content.basics.headline)}</div>` : ""}<div class="contact">${contact}</div></div></header>${keys.map((k) => section(k, i, v)).join("")}</div>`;
  return wrapDocument(inner, css, i);
}

/* ================================================================== */
/* 2. MODERNE (bandeau coloré + 2 colonnes)                            */
/* ================================================================== */
function moderne(i: RenderInput): string {
  const side: SectionKey[] = ["skills", "languages", "interests"];
  const mainKeys = orderedSections(i.content, i.style).filter((k) => !side.includes(k));
  const sideKeys = orderedSections(i.content, i.style, side);
  const v: Variant = { skills: skillChips, cls: "" };
  const css = `${COMMON_CSS}
@page{margin:12mm 0}
@page :first{margin:0 0 12mm}
.band{background:var(--accent);color:#fff;padding:11mm 15mm 9mm;display:flex;align-items:center;gap:8mm;position:relative;overflow:hidden}
.band:after{content:"";position:absolute;right:-18mm;top:-22mm;width:70mm;height:70mm;border-radius:50%;background:rgba(255,255,255,.09)}
.band:before{content:"";position:absolute;right:20mm;bottom:-30mm;width:50mm;height:50mm;border-radius:50%;background:rgba(255,255,255,.06)}
.band h1{font-size:2.5em;font-weight:700;letter-spacing:-.01em}
.band .headline{font-size:1.25em;opacity:.92;margin-top:.15em}
.band .photo{border:3px solid rgba(255,255,255,.85);flex:none}
.band .id{position:relative;z-index:1;flex:1}
.body{display:grid;grid-template-columns:1fr 62mm;gap:9mm;padding:9mm 15mm 4mm}
.main .sec h2{color:var(--accent);font-size:1.12em;margin-bottom:.8em;display:flex;align-items:center;gap:8px}
.main .sec h2:after{content:"";flex:1;height:1.5px;background:var(--accent-mid)}
.main article .row h3{color:var(--ink)}
.side{background:var(--accent-soft);border-radius:4mm;padding:6mm 5mm;align-self:start}
.side h2{font-size:.9em;text-transform:uppercase;letter-spacing:.12em;color:var(--accent);margin-bottom:.7em}
.side .sec{margin-bottom:5mm}
.side .chip{background:#fff;border:1px solid var(--accent-mid);padding:1px 7px;border-radius:99px;font-size:.9em}
.side ul.cts{list-style:none;margin-bottom:5mm}
.side .cts .ct{word-break:break-all}
.side .lg b{font-size:.98em}
`;
  const inner = `<header class="band">${photoImg(i, "28mm")}<div class="id"><h1>${esc(fullName(i.content))}</h1>${i.content.basics.headline ? `<div class="headline">${esc(i.content.basics.headline)}</div>` : ""}</div></header>
<div class="body"><main class="main">${mainKeys.map((k) => section(k, i, v)).join("")}</main>
<aside class="side"><section class="sec"><h2>${esc(LABELS[i.lang].contact)}</h2><ul class="cts plain">${contactRows(i)}</ul></section>${sideKeys.map((k) => section(k, i, v)).join("")}</aside></div>`;
  return wrapDocument(inner, css, i);
}

/* ================================================================== */
/* 3. JEUNE DIPLÔMÉ (colonne latérale claire, formation en tête)       */
/* ================================================================== */
function jeune(i: RenderInput): string {
  const side: SectionKey[] = ["skills", "languages", "interests"];
  const base = orderedSections(i.content, i.style).filter((k) => !side.includes(k));
  // la formation passe devant les expériences sauf si l'utilisateur a réordonné
  const mainKeys = i.style.order.length ? base : (["summary", "education", ...base.filter((k) => k !== "summary" && k !== "education")] as SectionKey[]).filter((k) => base.includes(k));
  const sideKeys = orderedSections(i.content, i.style, side);
  const v: Variant = { skills: skillDots, cls: "" };
  const css = `${COMMON_CSS}
@page{margin:0}
html{background:linear-gradient(90deg,var(--accent-soft) 0,var(--accent-soft) 70mm,#fff 70mm)}
.grid{display:grid;grid-template-columns:70mm 1fr;min-height:297mm;padding:11mm 0;box-decoration-break:clone;-webkit-box-decoration-break:clone}
.side{padding:0 8mm 0 9mm}
.side .photo{margin:0 auto 7mm;border:3px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.12)}
.side h2{font-size:.88em;text-transform:uppercase;letter-spacing:.14em;color:var(--accent);margin-bottom:.7em;padding-bottom:.35em;border-bottom:1.5px solid var(--accent-mid)}
.side .sec{margin-bottom:6mm}
.side .ct{word-break:break-all}
.side .chip{background:#fff;border-radius:99px;padding:1px 8px;font-size:.9em;border:1px solid var(--accent-mid)}
.main{padding:0 14mm 0 10mm}
.main h1{font-size:2.5em;font-weight:700;line-height:1.08;color:var(--ink)}
.main h1 b{color:var(--accent)}
.main .headline{margin:.3em 0 6mm;font-size:1.2em;color:var(--muted)}
.main .sec h2{font-size:1.05em;color:var(--ink);text-transform:uppercase;letter-spacing:.12em;display:flex;align-items:center;gap:8px;margin-bottom:.8em}
.main .sec h2:before{content:"";width:9px;height:9px;border-radius:2px;background:var(--accent);transform:rotate(45deg)}
.main article{padding-left:5mm;border-left:2px solid var(--accent-mid)}
`;
  const b = i.content.basics;
  const inner = `<div class="grid"><aside class="side">${photoImg(i, "40mm")}<section class="sec"><h2>${esc(LABELS[i.lang].contact)}</h2><ul class="plain">${contactRows(i)}</ul></section>${sideKeys.map((k) => section(k, i, v)).join("")}</aside>
<main class="main"><h1>${esc(b.firstName)} <b>${esc(b.lastName)}</b></h1>${b.headline ? `<div class="headline">${esc(b.headline)}</div>` : ""}${mainKeys.map((k) => section(k, i, v)).join("")}</main></div>`;
  return wrapDocument(inner, css, i);
}

/* ================================================================== */
/* 4. TECHNIQUE (colonne sombre, barres de compétences)                */
/* ================================================================== */
function technique(i: RenderInput): string {
  const side: SectionKey[] = ["skills", "languages", "interests"];
  const mainKeys = orderedSections(i.content, i.style).filter((k) => !side.includes(k));
  const sideKeys = orderedSections(i.content, i.style, side);
  const v: Variant = { skills: skillBars, cls: "" };
  const css = `${COMMON_CSS}
@page{margin:0}
html{background:linear-gradient(90deg,#0f1b2d 0,#0f1b2d 74mm,#fff 74mm)}
.grid{display:grid;grid-template-columns:74mm 1fr;min-height:297mm;padding:11mm 0;box-decoration-break:clone;-webkit-box-decoration-break:clone}
.side{color:#e6edf6;padding:0 9mm 0 10mm}
.side .photo{margin:0 0 6mm;border:3px solid var(--accent)}
.side .nm{font-size:1.65em;font-weight:700;line-height:1.1;color:#fff}
.side .headline{color:var(--accent-mid);margin:.3em 0 6mm;font-weight:700}
.side h2{font-size:.82em;letter-spacing:.2em;text-transform:uppercase;color:var(--accent-mid);margin:0 0 .7em;display:flex;gap:8px;align-items:center}
.side h2:after{content:"";flex:1;height:1px;background:rgba(255,255,255,.18)}
.side .sec{margin-bottom:6mm}
.side .ic{color:var(--accent-mid)}
.side .ct{word-break:break-all}
.side .lg span{color:#aab7c8}
.side .chip{background:rgba(255,255,255,.1);border-radius:4px;padding:1px 7px;font-size:.9em;color:#fff}
.main{padding:0 14mm 0 11mm}
.main .sec h2{font-size:1em;text-transform:uppercase;letter-spacing:.18em;color:var(--ink);margin-bottom:.9em;display:flex;align-items:center;gap:8px}
.main .sec h2:before{content:"";width:18px;height:3px;background:var(--accent);border-radius:2px}
.main .summary{font-size:1.05em;border-left:3px solid var(--accent);padding-left:4mm;color:#2c3744}
.main article{position:relative;padding-left:6mm}
.main article:before{content:"";position:absolute;left:0;top:.45em;width:8px;height:8px;border-radius:50%;background:var(--accent)}
.main article:after{content:"";position:absolute;left:3.5px;top:1.4em;bottom:-3.4mm;width:1px;background:var(--line)}
.main article:last-child:after{display:none}
.main .dates{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.8em}
`;
  const b = i.content.basics;
  const inner = `<div class="grid"><aside class="side">${photoImg(i, "38mm")}<div class="nm">${esc(b.firstName)}<br>${esc(b.lastName)}</div>${b.headline ? `<div class="headline">${esc(b.headline)}</div>` : ""}<section class="sec"><h2>${esc(LABELS[i.lang].contact)}</h2><ul class="plain">${contactRows(i)}</ul></section>${sideKeys.map((k) => section(k, i, v)).join("")}</aside>
<main class="main">${mainKeys.map((k) => section(k, i, v)).join("")}</main></div>`;
  return wrapDocument(inner, css, i);
}

/* ================================================================== */
/* 5. SOBRE (très aéré, libellés en marge)                             */
/* ================================================================== */
function sobre(i: RenderInput): string {
  const v: Variant = { skills: (x) => `<div class="inline">${x.content.skills.map((s) => esc(s.name)).join(" &nbsp;/&nbsp; ")}</div>`, cls: "" };
  const keys = orderedSections(i.content, i.style);
  const b = i.content.basics;
  const contact = contactList(i.content);
  const css = `${COMMON_CSS}
@page{margin:10mm 0}
.page{padding:3mm 20mm}
.head{display:flex;justify-content:space-between;align-items:flex-end;gap:8mm;margin-bottom:9mm}
.head h1{font-size:2.9em;font-weight:400;letter-spacing:-.015em;line-height:1.05}
.head h1 b{font-weight:700}
.head .headline{margin-top:.5em;letter-spacing:.2em;text-transform:uppercase;font-size:.82em;color:var(--accent);font-weight:700}
.head .photo{flex:none}
.cts{display:flex;flex-wrap:wrap;gap:3px 18px;padding:3.5mm 0;border-top:1px solid var(--ink);border-bottom:1px solid var(--line);margin-bottom:9mm;list-style:none}
.cts .ct{margin:0;font-size:.9em}
.sec{display:grid;grid-template-columns:36mm 1fr;gap:0 6mm;margin-bottom:calc(6mm * var(--d))}
.sec h2{font-size:.78em;text-transform:uppercase;letter-spacing:.2em;color:var(--muted);padding-top:.3em}
.sec>*:not(h2){grid-column:2}
.row h3{font-weight:700}
.dates{font-size:.82em}
.chip{background:none;border:0;padding:0 14px 0 0;font-size:1em}
.chips{gap:2px 0}
.chip:after{content:"/";margin-left:12px;color:var(--accent-mid)}
.chip:last-child:after{display:none}
.inline{line-height:1.8}
.sec .plain{display:flex;flex-wrap:wrap;gap:2px 22px}
.lg{flex-direction:row;gap:8px;align-items:baseline}
`;
  const inner = `<div class="page"><header class="head"><div><h1>${esc(b.firstName)} <b>${esc(b.lastName)}</b></h1>${b.headline ? `<div class="headline">${esc(b.headline)}</div>` : ""}</div>${photoImg(i, "26mm")}</header>
<ul class="cts">${contactRows(i)}</ul>${contact.length === 0 ? "" : ""}${keys.map((k) => section(k, i, v)).join("")}</div>`;
  return wrapDocument(inner, css, i);
}

export const RENDERERS: Record<string, (i: RenderInput) => string> = {
  classique, moderne, "jeune-diplome": jeune, technique, sobre,
};

export const TEMPLATE_DEFS = [
  { slug: "classique", name: "Classique", description: "Sobre et formel, parfait pour l’administration et les candidatures traditionnelles.", category: "Formel", hasPhoto: true, columns: 1 },
  { slug: "moderne", name: "Moderne", description: "Bandeau coloré et deux colonnes pour un profil dynamique et commercial.", category: "Créatif", hasPhoto: true, columns: 2 },
  { slug: "jeune-diplome", name: "Jeune diplômé", description: "Formation mise en avant, idéal pour un premier emploi ou un stage.", category: "Débutant", hasPhoto: true, columns: 2 },
  { slug: "technique", name: "Technique", description: "Colonne sombre et compétences en barres pour les profils techniques.", category: "Technique", hasPhoto: true, columns: 2 },
  { slug: "sobre", name: "Sobre", description: "Très aéré et élégant, lecture rapide pour ONG et profils internationaux.", category: "Minimal", hasPhoto: false, columns: 1 },
] as const;

export function renderDocumentHtml(slug: string, input: RenderInput): string {
  const fn = RENDERERS[slug] ?? RENDERERS.classique;
  return fn(input);
}
