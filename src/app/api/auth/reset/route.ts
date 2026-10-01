import { z } from "zod";
import { db } from "@/lib/db";
import { hashPassword, hashToken, passwordIssue } from "@/lib/auth";
import { fail, json, parse, route } from "@/lib/http";

export const POST = route(async (req) => {
  const { token, password } = await parse(req, z.object({ token: z.string().min(20).max(200), password: z.string().max(200) }));
  const issue = passwordIssue(password);
  if (issue) return fail(issue, 422);
  const r = await db.passwordReset.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!r || r.usedAt || r.expiresAt < new Date()) return fail("Ce lien est invalide ou a expiré.", 400);
  await db.$transaction([
    db.user.update({ where: { id: r.userId }, data: { passwordHash: hashPassword(password), failedLogins: 0, lockedUntil: null } }),
    db.passwordReset.update({ where: { id: r.id }, data: { usedAt: new Date() } }),
  ]);
  return json({ ok: true });
});
