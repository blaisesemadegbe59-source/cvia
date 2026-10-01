import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { parseContent } from "@/lib/cv-schema";
import { buildCvHtml, accessFor } from "@/lib/cv-service";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = { title: "CV partagé", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function Shared({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const link = await db.shareLink.findUnique({ where: { token }, include: { cv: true } });
  if (!link || link.revokedAt || (link.expiresAt && link.expiresAt < new Date())) notFound();
  await db.shareLink.update({ where: { id: link.id }, data: { views: { increment: 1 }, lastViewedAt: new Date() } });
  const cv = link.cv;
  const content = parseContent(cv.content);
  if (!link.showContact) { content.basics.email = ""; content.basics.phone = ""; content.basics.address = ""; }
  const { access } = await accessFor(cv.userId, cv);
  const html = await buildCvHtml({ ...cv, content: JSON.stringify(content) }, { watermark: !access.cleanPdf });
  // Les polices sont intégrées (base64) : l'iframe est autonome ; aucun script n'est exécuté.
  return (
    <div className="min-h-dvh bg-stone-200">
      <div className="mx-auto flex max-w-[860px] items-center justify-between px-4 py-4"><Logo /><Link href="/creer" className="btn btn-primary btn-sm">Créer mon CV</Link></div>
      <div className="mx-auto max-w-[860px] px-2 pb-10 sm:px-4">
        <iframe title="CV" srcDoc={html} sandbox="" className="h-[1200px] w-full rounded-lg bg-white shadow-lift" style={{ aspectRatio: "210 / 297", height: "auto", minHeight: 900 }} />
      </div>
    </div>
  );
}
