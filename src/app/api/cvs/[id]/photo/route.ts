import sharp from "sharp";
import { db } from "@/lib/db";
import { authed, fail, json, route } from "@/lib/http";
import { getOwnedCv } from "@/lib/cv-service";
import { deleteFile, putFile } from "@/lib/storage";

type Ctx = { params: Promise<{ id: string }> };
const MAX = 5 * 1024 * 1024;

async function removeCurrent(cvId: string, assetId: string | null) {
  if (!assetId) return;
  const a = await db.asset.findUnique({ where: { id: assetId } });
  await db.cv.update({ where: { id: cvId }, data: { photoAssetId: null } });
  if (a) { await deleteFile(a.storageKey); await db.asset.delete({ where: { id: a.id } }); }
}

export const POST = route<Ctx>(async (req, { params }) => {
  const user = await authed();
  const cv = await getOwnedCv((await params).id, user.id);
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return fail("Aucun fichier reçu.", 422);
  if (file.size > MAX) return fail("Image trop lourde (5 Mo maximum).", 413);
  const input = Buffer.from(await file.arrayBuffer());
  let out: Buffer;
  try {
    // Le type est vérifié sur le contenu réel (pas sur l'extension). EXIF supprimé, orientation corrigée.
    out = await sharp(input).rotate().resize(800, 800, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toBuffer();
  } catch {
    return fail("Format d’image non reconnu (JPEG, PNG ou WebP).", 415);
  }
  const key = await putFile(out, "jpg", "photos");
  const asset = await db.asset.create({ data: { ownerId: user.id, kind: "PHOTO", storageKey: key, mime: "image/jpeg", sizeBytes: out.length } });
  const old = cv.photoAssetId;
  await db.cv.update({ where: { id: cv.id }, data: { photoAssetId: asset.id } });
  if (old) { const a = await db.asset.findUnique({ where: { id: old } }); if (a) { await deleteFile(a.storageKey); await db.asset.delete({ where: { id: a.id } }); } }
  return json({ photoAssetId: asset.id });
});

export const DELETE = route<Ctx>(async (_req, { params }) => {
  const user = await authed();
  const cv = await getOwnedCv((await params).id, user.id);
  await removeCurrent(cv.id, cv.photoAssetId);
  return json({ ok: true });
});
