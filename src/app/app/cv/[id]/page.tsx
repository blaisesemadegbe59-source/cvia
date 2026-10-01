import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Editor } from "@/components/editor/Editor";
import { parseContent, parseStyle } from "@/lib/cv-schema";
import { accessFor } from "@/lib/cv-service";
import { creditBalance } from "@/lib/orders";

export const metadata = { title: "Éditeur de CV" };

export default async function EditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/app/cv/${id}`);
  const cv = await db.cv.findFirst({ where: { id, userId: user.id } });
  if (!cv) notFound();
  const [{ access }, credits, templates, single] = await Promise.all([
    accessFor(user.id, cv), creditBalance(user.id),
    db.template.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    db.product.findUnique({ where: { code: "CV_SINGLE" } }),
  ]);
  return (
    <Editor
      mode="user" cvId={cv.id} photoAssetId={cv.photoAssetId} access={access} credits={credits} priceXof={single?.priceXof ?? 1200}
      templates={templates.map((t) => ({ slug: t.slug, name: t.name, hasPhoto: t.hasPhoto }))}
      initial={{ title: cv.title, templateSlug: cv.templateSlug, lang: cv.lang === "en" ? "en" : "fr", content: parseContent(cv.content), style: parseStyle(cv.style) }}
    />
  );
}
