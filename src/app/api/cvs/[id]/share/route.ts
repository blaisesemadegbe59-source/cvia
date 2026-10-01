import { z } from "zod";
import crypto from "node:crypto";
import { db } from "@/lib/db";
import { authed, json, parse, route } from "@/lib/http";
import { getOwnedCv } from "@/lib/cv-service";

type Ctx = { params: Promise<{ id: string }> };
const schema = z.object({ showContact: z.boolean().default(false), days: z.number().int().min(1).max(365).nullable().default(30) });

export const POST = route<Ctx>(async (req, { params }) => {
  const user = await authed();
  const cv = await getOwnedCv((await params).id, user.id);
  const d = await parse(req, schema);
  const expiresAt = d.days ? new Date(Date.now() + d.days * 86_400_000) : null;
  const existing = await db.shareLink.findUnique({ where: { cvId: cv.id } });
  const link = existing
    ? await db.shareLink.update({ where: { id: existing.id }, data: { showContact: d.showContact, expiresAt, revokedAt: null } })
    : await db.shareLink.create({ data: { cvId: cv.id, token: crypto.randomBytes(18).toString("base64url"), showContact: d.showContact, expiresAt } });
  return json({ token: link.token, expiresAt: link.expiresAt });
});

export const GET = route<Ctx>(async (_req, { params }) => {
  const user = await authed();
  const cv = await getOwnedCv((await params).id, user.id);
  const l = await db.shareLink.findUnique({ where: { cvId: cv.id } });
  return json({ link: l && !l.revokedAt ? { token: l.token, expiresAt: l.expiresAt, showContact: l.showContact, views: l.views } : null });
});

export const DELETE = route<Ctx>(async (_req, { params }) => {
  const user = await authed();
  const cv = await getOwnedCv((await params).id, user.id);
  await db.shareLink.updateMany({ where: { cvId: cv.id }, data: { revokedAt: new Date() } });
  return json({ ok: true });
});
