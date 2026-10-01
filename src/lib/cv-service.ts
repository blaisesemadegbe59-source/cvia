import "server-only";
import type { Cv } from "@prisma/client";
import { db } from "./db";
import { getFile } from "./storage";
import { parseContent, parseStyle } from "./cv-schema";
import { renderDocumentHtml } from "./templates/templates";
import { fontCssInline } from "./templates/fonts-inline";
import { activePass } from "./orders";
import { getCvAccess } from "./access";
import { getSettings } from "./settings";
import { HttpError } from "./http";
import crypto from "node:crypto";

export async function getOwnedCv(id: string, userId: string): Promise<Cv> {
  const cv = await db.cv.findFirst({ where: { id, userId } });
  if (!cv) throw new HttpError("CV introuvable.", 404);
  return cv;
}

export async function accessFor(userId: string, cv: Pick<Cv, "unlockedAt" | "editableUntil">) {
  const pass = await activePass(userId);
  return { access: getCvAccess({ now: new Date(), cv, passActive: !!pass }), passEndsAt: pass?.endsAt ?? null };
}

export async function photoDataUri(assetId: string | null): Promise<string | null> {
  if (!assetId) return null;
  const a = await db.asset.findUnique({ where: { id: assetId } });
  if (!a) return null;
  const buf = await getFile(a.storageKey);
  return buf ? `data:${a.mime};base64,${buf.toString("base64")}` : null;
}

export async function buildCvHtml(cv: Cv, opts: { watermark: boolean; withPhoto?: boolean }): Promise<string> {
  const style = parseStyle(cv.style);
  const s = await getSettings();
  const photoUrl = opts.withPhoto === false ? null : await photoDataUri(cv.photoAssetId);
  return renderDocumentHtml(cv.templateSlug, {
    content: parseContent(cv.content), style, lang: cv.lang === "en" ? "en" : "fr",
    photoUrl, watermark: opts.watermark, fontCss: fontCssInline(style.font), brand: s.brand,
  });
}

export const slugFile = (c: Cv) => {
  const content = parseContent(c.content);
  const n = `${content.basics.firstName}_${content.basics.lastName}`.normalize("NFD").replace(/[^\w]+/g, "_").replace(/^_+|_+$/g, "");
  return `CV_${n || "cv"}.pdf`;
};

export const etag = (s: string) => crypto.createHash("sha1").update(s).digest("hex");

export async function saveRevision(cv: { id: string; content: string; style: string }) {
  const last = await db.cvRevision.findFirst({ where: { cvId: cv.id }, orderBy: { createdAt: "desc" } });
  if (last && last.content === cv.content && last.style === cv.style) return;
  // au plus une révision toutes les 2 minutes (évite 1 révision par frappe)
  if (last && Date.now() - last.createdAt.getTime() < 120_000) return;
  await db.cvRevision.create({ data: { cvId: cv.id, content: cv.content, style: cv.style } });
  const all = await db.cvRevision.findMany({ where: { cvId: cv.id }, orderBy: { createdAt: "desc" }, skip: 20, select: { id: true } });
  if (all.length) await db.cvRevision.deleteMany({ where: { id: { in: all.map((r) => r.id) } } });
}
