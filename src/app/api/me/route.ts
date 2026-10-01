import { z } from "zod";
import { db } from "@/lib/db";
import { authed, fail, json, parse, route } from "@/lib/http";
import { destroySession, hashPassword, passwordIssue, verifyPassword, audit } from "@/lib/auth";
import { normalizePhone } from "@/lib/phone";
import { deleteFile } from "@/lib/storage";

export const PATCH = route(async (req) => {
  const user = await authed();
  const d = await parse(req, z.object({ name: z.string().trim().min(2, "Indiquez votre nom.").max(80), phone: z.string().trim().max(30).optional().or(z.literal("")) }));
  let phone: string | null = null;
  if (d.phone) {
    phone = normalizePhone(d.phone);
    if (!phone) return fail("Numéro de téléphone invalide.", 422);
    const other = await db.user.findUnique({ where: { phone } });
    if (other && other.id !== user.id) return fail("Ce numéro est déjà utilisé.", 409);
  }
  await db.user.update({ where: { id: user.id }, data: { name: d.name, phone } });
  return json({ ok: true });
});

export const PUT = route(async (req) => {
  const user = await authed();
  const d = await parse(req, z.object({ current: z.string().max(200), password: z.string().max(200) }));
  if (!verifyPassword(d.current, user.passwordHash)) return fail("Mot de passe actuel incorrect.", 403);
  const issue = passwordIssue(d.password); if (issue) return fail(issue, 422);
  await db.user.update({ where: { id: user.id }, data: { passwordHash: hashPassword(d.password) } });
  return json({ ok: true });
});

/** Suppression du compte (droit à l'effacement) : CV, photos, notifications supprimés ; commandes conservées anonymisées. */
export const DELETE = route(async (req) => {
  const user = await authed();
  const d = await parse(req, z.object({ password: z.string().max(200) }));
  if (!verifyPassword(d.password, user.passwordHash)) return fail("Mot de passe incorrect.", 403);
  const assets = await db.asset.findMany({ where: { ownerId: user.id } });
  for (const a of assets) await deleteFile(a.storageKey);
  await db.asset.deleteMany({ where: { ownerId: user.id } });
  await db.cv.deleteMany({ where: { userId: user.id } });
  await db.user.update({ where: { id: user.id }, data: { status: "DELETED", email: `deleted-${user.id}@deleted.local`, phone: null, name: "Compte supprimé", passwordHash: null, totpSecret: null } });
  await audit(user.id, "ACCOUNT_DELETED", "User", user.id);
  await destroySession();
  return json({ ok: true });
});
