import type { CvContent, CvStyle, SectionKey } from "../cv-schema";
import { SECTION_KEYS } from "../cv-schema";

export type Lang = "fr" | "en";

export interface RenderInput {
  content: CvContent;
  style: CvStyle;
  lang: Lang;
  photoUrl?: string | null;
  watermark?: boolean;
  /** "url" : polices servies depuis /fonts (aperçu) ; "inline" : base64 (PDF). */
  fontCss: string;
  brand?: string;
}

export const LABELS: Record<Lang, Record<string, string>> = {
  fr: {
    summary: "Profil", experiences: "Expériences professionnelles", education: "Formation",
    skills: "Compétences", languages: "Langues", certifications: "Certifications",
    projects: "Projets", volunteering: "Engagement associatif", interests: "Centres d’intérêt",
    references: "Références", contact: "Contact", present: "En cours", madeWith: "Créé avec",
  },
  en: {
    summary: "Profile", experiences: "Work experience", education: "Education",
    skills: "Skills", languages: "Languages", certifications: "Certifications",
    projects: "Projects", volunteering: "Volunteering", interests: "Interests",
    references: "References", contact: "Contact", present: "Present", madeWith: "Made with",
  },
};

const MONTHS: Record<Lang, string[]> = {
  fr: ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

export const esc = (s: unknown): string =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

export function fmtMonth(v: string | null | undefined, lang: Lang): string {
  if (!v) return "";
  const m = /^(\d{4})-(\d{2})$/.exec(v);
  if (!m) return esc(v);
  return `${MONTHS[lang][Number(m[2]) - 1] ?? ""} ${m[1]}`.trim();
}

export function fmtRange(start: string | null | undefined, end: string | null | undefined, lang: Lang): string {
  const s = fmtMonth(start, lang);
  const e = end ? fmtMonth(end, lang) : s ? LABELS[lang].present : "";
  if (!s && !e) return "";
  if (!s) return e;
  return `${s} – ${e}`;
}

/** Lignes -> liste à puces (une ligne = une puce) ; une seule ligne -> paragraphe. */
export function richText(text: string): string {
  const lines = String(text ?? "").split(/\r?\n/).map((l) => l.replace(/^\s*[-•*]\s*/, "").trim()).filter(Boolean);
  if (lines.length === 0) return "";
  if (lines.length === 1) return `<p>${esc(lines[0])}</p>`;
  return `<ul>${lines.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>`;
}

export function isEmptySection(key: SectionKey, c: CvContent): boolean {
  switch (key) {
    case "summary": return !c.summary.trim();
    case "interests": return c.interests.filter(Boolean).length === 0;
    default: {
      const v = c[key] as unknown[];
      return !v || v.length === 0;
    }
  }
}

/** Ordre final : ordre utilisateur puis ordre par défaut ; sections masquées ou vides retirées. */
export function orderedSections(c: CvContent, s: CvStyle, only?: readonly SectionKey[]): SectionKey[] {
  const known = new Set<string>(SECTION_KEYS);
  const userOrder = s.order.filter((k) => known.has(k)) as SectionKey[];
  const rest = SECTION_KEYS.filter((k) => !userOrder.includes(k));
  const all = [...userOrder, ...rest];
  return all.filter((k) => (!only || only.includes(k)) && !s.hidden.includes(k) && !isEmptySection(k, c));
}

export interface Contact { kind: "phone" | "email" | "place" | "link"; label: string; text: string }
export function contactList(c: CvContent): Contact[] {
  const b = c.basics;
  const out: Contact[] = [];
  if (b.phone) out.push({ kind: "phone", label: "Tél.", text: b.phone });
  if (b.email) out.push({ kind: "email", label: "E-mail", text: b.email });
  const place = [b.address, [b.city, b.country].filter(Boolean).join(", ")].filter(Boolean).join(" — ");
  if (place) out.push({ kind: "place", label: "Adresse", text: place });
  for (const l of b.links) if (l.url) out.push({ kind: "link", label: l.label || "Web", text: l.url });
  return out;
}

export const fullName = (c: CvContent) => `${c.basics.firstName} ${c.basics.lastName}`.trim();
export const initials = (c: CvContent) => `${c.basics.firstName[0] ?? ""}${c.basics.lastName[0] ?? ""}`.toUpperCase();

const SCALE = { sm: 9, md: 10, lg: 11 } as const;
const DENSITY = { compact: 0.7, normal: 0.88, airy: 1.15 } as const;

export function baseCss(s: CvStyle): string {
  return `
:root{--accent:${s.accent};--accent-soft:color-mix(in srgb,var(--accent) 10%,#fff);--accent-mid:color-mix(in srgb,var(--accent) 35%,#fff);--ink:#1c2430;--muted:#5b6675;--line:#dfe4ea;--fs:${SCALE[s.scale]}pt;--d:${DENSITY[s.density]};--font:'${s.font}',system-ui,-apple-system,'Segoe UI',Arial,sans-serif}
@page{size:A4;margin:0}
*{box-sizing:border-box;margin:0;padding:0}
html{-webkit-print-color-adjust:exact;print-color-adjust:exact;background:#fff}
body{font-family:var(--font);font-size:var(--fs);line-height:1.45;color:var(--ink);width:210mm;margin:0 auto;background:transparent;overflow-wrap:anywhere}
ul{padding-left:1.15em}li{margin:.12em 0}p{margin:0}
h1,h2,h3{line-height:1.2}h2,h3{break-after:avoid}
article{break-inside:avoid}
section{break-inside:auto}
.photo{object-fit:cover;display:block}
.photo.round{border-radius:50%}.photo.square{border-radius:6px}
.wm{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;pointer-events:none;z-index:50}
.wm span{transform:rotate(-32deg);font-size:46pt;font-weight:700;letter-spacing:.06em;color:rgba(20,30,40,.075);white-space:nowrap}
.wmfoot{position:fixed;bottom:0.6mm;left:0;right:0;text-align:center;font-size:7pt;color:#7a8594;z-index:51}
`;
}

export function wrapDocument(inner: string, css: string, i: RenderInput, extraBodyClass = ""): string {
  const wm = i.watermark
    ? `<div class="wm"><span>${esc(i.brand ?? "Cvia")}</span></div><div class="wmfoot">${esc(LABELS[i.lang].madeWith)} ${esc(i.brand ?? "Cvia")}</div>`
    : "";
  return `<!doctype html><html lang="${i.lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(fullName(i.content) || "CV")}</title><style>${i.fontCss}${baseCss(i.style)}${css}</style></head><body class="${extraBodyClass}">${inner}${wm}</body></html>`;
}

export const sp = (mm: number) => `calc(${mm}mm * var(--d))`;
