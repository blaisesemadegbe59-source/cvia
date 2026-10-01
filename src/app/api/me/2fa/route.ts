import { z } from "zod";
import QRCode from "qrcode";
import { authenticator } from "otplib";
import { db } from "@/lib/db";
import { isStaff, audit } from "@/lib/auth";
import { authed, fail, json, parse, route } from "@/lib/http";

/** Double authentification (TOTP) pour les comptes de l'équipe. */
export const POST = route(async () => {
  const u = await authed();
  if (!isStaff(u)) return fail("Réservé à l’équipe.", 403);
  const secret = authenticator.generateSecret();
  await db.user.update({ where: { id: u.id }, data: { totpSecret: secret, totpEnabled: false } });
  const uri = authenticator.keyuri(u.email ?? "admin", process.env.NEXT_PUBLIC_APP_NAME || "Cvia", secret);
  return json({ secret, qr: await QRCode.toDataURL(uri, { margin: 1, width: 220 }) });
});

export const PUT = route(async (req) => {
  const u = await authed();
  const { code } = await parse(req, z.object({ code: z.string().trim().length(6, "Code à 6 chiffres.") }));
  const fresh = await db.user.findUnique({ where: { id: u.id } });
  if (!fresh?.totpSecret || !authenticator.check(code, fresh.totpSecret)) return fail("Code invalide.", 422);
  await db.user.update({ where: { id: u.id }, data: { totpEnabled: true } });
  await audit(u.id, "2FA_ENABLED", "User", u.id);
  return json({ ok: true });
});
