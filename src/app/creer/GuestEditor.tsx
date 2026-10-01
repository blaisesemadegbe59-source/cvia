"use client";
import { useEffect, useState } from "react";
import { Editor, type CvDoc } from "@/components/editor/Editor";
import { cvContentSchema, cvStyleSchema, emptyContent, defaultStyle } from "@/lib/cv-schema";

export function GuestEditor({ slug, templates, priceXof }: { slug: string; templates: { slug: string; name: string; hasPhoto: boolean }[]; priceXof: number }) {
  const [initial, setInitial] = useState<CvDoc | null>(null);
  useEffect(() => {
    let doc: CvDoc = { title: "Mon CV", templateSlug: slug, lang: "fr", content: emptyContent(), style: defaultStyle() };
    try {
      const raw = localStorage.getItem("cvia:draft");
      if (raw) {
        const d = JSON.parse(raw);
        const content = cvContentSchema.safeParse(d.content); const style = cvStyleSchema.safeParse(d.style);
        if (content.success && style.success) doc = { title: String(d.title || "Mon CV"), templateSlug: slug, lang: d.lang === "en" ? "en" : "fr", content: content.data, style: style.data };
      }
    } catch { /* brouillon corrompu : on repart de zéro */ }
    setInitial(doc);
  }, [slug]);
  if (!initial) return <div className="flex h-dvh items-center justify-center text-stone-500">Chargement…</div>;
  return <Editor mode="guest" initial={initial} templates={templates} priceXof={priceXof} />;
}
