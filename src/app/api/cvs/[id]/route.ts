import { z } from "zod";
import { db } from "@/lib/db";
import { authed, json, parse, route } from "@/lib/http";
import { cvContentSchema, cvStyleSchema } from "@/lib/cv-schema";
import { accessFor, getOwnedCv, saveRevision } from "@/lib/cv-service";
import { deleteFile } from "@/lib/storage";

type Ctx = { params: Promise<{ id: string }> };

const patch = z.object({
  title: z.string().trim().min(1).max(80).optional(),
  templateSlug: z.string().max(40).optional(),
  lang: z.enum(["fr", "en"]).optional(),
  content: cvContentSchema.optional(),
  style: cvStyleSchema.optional(),
});

export const GET = route<Ctx>(async (_req, { params }) => {
  const user = await authed();
  const cv = await getOwnedCv((await params).id, user.id);
  const { access } = await accessFor(user.id, cv);
  return json({ cv, access });
});

/** Sauvegarde. Le contenu est TOUJOURS modifiable : le paiement ne conditionne que le PDF sans filigrane. */
export const PATCH = route<Ctx>(async (req, { params }) => {
  const user = await authed();
  const cv = await getOwnedCv((await params).id, user.id);
  const d = await parse(req, patch);
  const data: Record<string, unknown> = {};
  if (d.title) data.title = d.title;
  if (d.lang) data.lang = d.lang;
  if (d.templateSlug) {
    const t = await db.template.findFirst({ where: { slug: d.templateSlug, isActive: true } });
    if (t) data.templateSlug = t.slug;
  }
  if (d.content) data.content = JSON.stringify(d.content);
  if (d.style) data.style = JSON.stringify(d.style);
  const updated = await db.cv.update({ where: { id: cv.id }, data });
  await saveRevision({ id: cv.id, content: cv.content, style: cv.style });
  return json({ ok: true, updatedAt: updated.updatedAt });
});

export const DELETE = route<Ctx>(async (_req, { params }) => {
  const user = await authed();
  const cv = await getOwnedCv((await params).id, user.id);
  if (cv.photoAssetId) {
    const a = await db.asset.findUnique({ where: { id: cv.photoAssetId } });
    if (a) { await deleteFile(a.storageKey); await db.asset.delete({ where: { id: a.id } }); }
  }
  await db.cv.delete({ where: { id: cv.id } });
  return json({ ok: true });
});
