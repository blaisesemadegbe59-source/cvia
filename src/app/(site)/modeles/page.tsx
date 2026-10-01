import Link from "next/link";
import type { Metadata } from "next";
import { TemplatePreview } from "@/components/TemplatePreview";
import { sampleContent } from "@/lib/cv-schema";
import { db } from "@/lib/db";

export const metadata: Metadata = { title: "Modèles de CV" };

export default async function Models() {
  const templates = await db.template.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
  const content = sampleContent();
  return (
    <div className="container-x py-14">
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow">Galerie</p>
        <h1 className="mt-3 text-4xl font-extrabold text-stone-900">Choisissez votre modèle</h1>
        <p className="mt-4 text-lg text-stone-600">Vous pourrez changer de modèle à tout moment : votre contenu est conservé.</p>
      </div>
      <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((t) => (
          <article key={t.id} className="card overflow-hidden transition hover:shadow-lift">
            <div className="bg-gradient-to-b from-stone-100 to-stone-200/70 p-6">
              <div className="overflow-hidden rounded-md bg-white shadow-soft ring-1 ring-black/5">
                <TemplatePreview slug={t.slug} content={content} />
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-stone-900">{t.name}</h2>
                <span className="badge bg-brand-50 text-brand-800">{t.category}</span>
              </div>
              <p className="mt-2 text-[15px] leading-6 text-stone-600">{t.description}</p>
              <div className="mt-3 flex gap-2 text-xs text-stone-500">
                <span>{t.columns === 2 ? "2 colonnes" : "1 colonne"}</span><span>·</span><span>{t.hasPhoto ? "Photo possible" : "Sans photo"}</span><span>·</span><span>A4</span>
              </div>
              <Link href={`/creer?modele=${t.slug}`} className="btn btn-primary mt-5 w-full">Utiliser ce modèle</Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
