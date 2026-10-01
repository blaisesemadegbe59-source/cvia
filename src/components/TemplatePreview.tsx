"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { renderDocumentHtml } from "@/lib/templates/templates";
import { fontCssUrl } from "@/lib/templates/fonts-url";
import type { CvContent, CvStyle } from "@/lib/cv-schema";
import { defaultStyle } from "@/lib/cv-schema";

const A4_W = 794; // 210 mm à 96 dpi
const A4_H = 1123;

/** Rend le CV dans une iframe A4 réduite à la largeur du conteneur (le HTML est identique à celui du PDF). */
export function TemplatePreview({
  slug, content, style, lang = "fr", photoUrl, watermark = false, className = "", pages = 1, onHeight, guides = false,
}: {
  slug: string; content: CvContent; style?: Partial<CvStyle>; lang?: "fr" | "en";
  photoUrl?: string | null; watermark?: boolean; className?: string; pages?: number;
  onHeight?: (h: number) => void; guides?: boolean;
}) {
  const wrap = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState(0.4);
  const [docH, setDocH] = useState(A4_H);

  useEffect(() => {
    const el = wrap.current; if (!el) return;
    const ro = new ResizeObserver(() => setScale(el.clientWidth / A4_W));
    ro.observe(el); setScale(el.clientWidth / A4_W);
    return () => ro.disconnect();
  }, []);

  const full = useMemo(() => ({ ...defaultStyle(), ...style }) as CvStyle, [style]);
  const html = useMemo(
    () => renderDocumentHtml(slug, { content, style: full, lang, photoUrl: photoUrl ?? null, watermark, fontCss: fontCssUrl(full.font), brand: process.env.NEXT_PUBLIC_APP_NAME || "Cvia" }),
    [slug, content, full, lang, photoUrl, watermark],
  );

  function measure() {
    try {
      const h = frame.current?.contentDocument?.documentElement.scrollHeight;
      if (h) { setDocH(Math.max(A4_H, h)); onHeight?.(h); }
    } catch { /* cross-origin : ignoré */ }
  }

  const shownH = pages === 0 ? docH : A4_H * pages;
  return (
    <div ref={wrap} className={`relative w-full overflow-hidden ${className}`} style={{ height: shownH * scale }}>
      <iframe
        ref={frame}
        title="Aperçu du CV"
        srcDoc={html}
        onLoad={() => { measure(); setTimeout(measure, 350); }}
        sandbox="allow-same-origin"
        className="absolute left-0 top-0 border-0 bg-white"
        style={{ width: A4_W, height: pages === 0 ? docH : A4_H * pages, transform: `scale(${scale})`, transformOrigin: "top left", pointerEvents: "none" }}
        tabIndex={-1}
      />
      {guides && Array.from({ length: Math.max(0, Math.floor((docH - 40) / A4_H)) }, (_, k) => (
        <div key={k} className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-dashed border-sun-500/80" style={{ top: (k + 1) * A4_H * scale }}>
          <span className="absolute right-2 top-1 rounded bg-sun-400 px-1.5 py-0.5 text-[10px] font-bold text-stone-900">Page {k + 2}</span>
        </div>
      ))}
    </div>
  );
}
