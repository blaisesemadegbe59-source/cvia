import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { SiteHeader } from "@/components/SiteHeader";
import { TemplatePreview } from "@/components/TemplatePreview";
import { sampleContent } from "@/lib/cv-schema";
import { GuestEditor } from "./GuestEditor";

export const metadata: Metadata = { title: "Créer mon CV" };

export default async function Create({ searchParams }: { searchParams: Promise<{ modele?: string }> }) {
  const { modele } = await searchParams;
  const user = await getCurrentUser();
  if (user && modele) redirect(`/app/nouveau?modele=${encodeURIComponent(modele)}`);
  const templates = await db.template.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
  const single = await db.product.findUnique({ where: { code: "CV_SINGLE" } });
  const chosen = templates.find((t) => t.slug === modele);
  if (chosen) {
    return <GuestEditor slug={chosen.slug} templates={templates.map((t) => ({ slug: t.slug, name: t.name, hasPhoto: t.hasPhoto }))} priceXof={single?.priceXof ?? 1200} />;
  }
  const content = sampleContent();
  return (
    <>
      <SiteHeader />
      <div className="container-x py-12">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Étape 1 sur 3</p>
          <h1 className="mt-3 text-4xl font-extrabold text-stone-900">Choisissez un modèle pour commencer</h1>
          <p className="mt-3 text-stone-600">Pas d’inquiétude, vous pourrez en changer à tout moment sans perdre votre contenu.</p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <Link key={t.id} href={`/creer?modele=${t.slug}`} className="group card overflow-hidden transition hover:-translate-y-1 hover:shadow-lift">
              <div className="bg-stone-100 p-5"><div className="overflow-hidden rounded bg-white shadow-soft"><TemplatePreview slug={t.slug} content={content} /></div></div>
              <div className="flex items-center justify-between p-5">
                <div><p className="font-display text-lg font-bold text-stone-900">{t.name}</p><p className="text-sm text-stone-500">{t.category}</p></div>
                <span className="btn btn-primary btn-sm">Choisir</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
