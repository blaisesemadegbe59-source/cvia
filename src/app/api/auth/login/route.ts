import { z } from "zod";
import { authenticator } from "otplib";
import { db } from "@/lib/db";
import { createSession, verifyPassword, clientIp, audit, isStaff } from "@/lib/auth";
import { fail, json, parse, route } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().max(200), code: z.string().trim().max(10).optional() });

export const POST = route(async (req) => {
  const ip = await clientIp();
  const d = await parse(req, schema);
  if (!rateLimit(`login:${ip}:${d.email}`, 8, 15 * 60_000).ok) return fail("Trop de tentatives. Réessayez dans quelques minutes.", 429);
  const user = await db.user.findUnique({ where: { email: d.email } });
  const generic = () => fail("E-mail ou mot de passe incorrect.", 401);
  if (!user || user.status !== "ACTIVE") return generic();
  if (user.lockedUntil && user.lockedUntil > new Date()) return fail("Compte temporairement verrouillé. Réessayez dans 15 minutes.", 423);
  if (!verifyPassword(d.password, user.passwordHash)) {
    const failed = user.failedLogins + 1;
    await db.user.update({ where: { id: user.id }, data: { failedLogins: failed, lockedUntil: failed >= 5 ? new Date(Date.now() + 15 * 60_000) : null } });
    return generic();
  }
  if (isStaff(user) && user.totpEnabled && user.totpSecret) {
    if (!d.code) return fail("Code de double authentification requis.", 401, { need2fa: true });
    if (!authenticator.check(d.code, user.totpSecret)) return fail("Code de double authentification invalide.", 401, { need2fa: true });
  }
  await db.user.update({ where: { id: user.id }, data: { failedLogins: 0, lockedUntil: null } });
  await createSession(user.id);
  if (isStaff(user)) await audit(user.id, "LOGIN", "User", user.id);
  return json({ ok: true, role: user.role });
});
