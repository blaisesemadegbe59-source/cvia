import { z } from "zod";
import { db } from "@/lib/db";
import { authed, fail, json, parse, route } from "@/lib/http";
import { getOwnedCv } from "@/lib/cv-service";

type Ctx = { params: Promise<{ id: string }> };

export const GET = route<Ctx>(async (_req, { params }) => {
  const user = await authed();
  const cv = await getOwnedCv((await params).id, user.id);
  const list = await db.cvRevision.findMany({ where: { cvId: cv.id }, orderBy: { createdAt: "desc" }, take: 20, select: { id: true, createdAt: true } });
  return json({ revisions: list });
});

export const POST = route<Ctx>(async (req, { params }) => {
  const user = await authed();
  const cv = await getOwnedCv((await params).id, user.id);
  const { revisionId } = await parse(req, z.object({ revisionId: z.string() }));
  const r = await db.cvRevision.findFirst({ where: { id: revisionId, cvId: cv.id } });
  if (!r) return fail("Version introuvable.", 404);
  await db.cvRevision.create({ data: { cvId: cv.id, content: cv.content, style: cv.style } }); // l'état actuel reste récupérable
  await db.cv.update({ where: { id: cv.id }, data: { content: r.content, style: r.style } });
  return json({ ok: true });
});
