import { z } from "zod";
import crypto from "node:crypto";
import { db } from "@/lib/db";
import { hashToken, clientIp } from "@/lib/auth";
import { baseUrl, fail, json, parse, route } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

export const POST = route(async (req) => {
  const { email } = await parse(req, z.object({ email: z.string().trim().toLowerCase().email() }));
  if (!rateLimit(`forgot:${await clientIp()}`, 5, 3600_000).ok) return fail("Trop de demandes. Réessayez plus tard.", 429);
  const user = await db.user.findUnique({ where: { email } });
  let devLink: string | undefined;
  if (user && user.status === "ACTIVE") {
    const token = crypto.randomBytes(32).toString("hex");
    await db.passwordReset.create({ data: { userId: user.id, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + 3600_000) } });
    const link = `${baseUrl(req)}/reinitialiser?token=${token}`;
    // En production : envoi par e-mail transactionnel. Ici : boîte d'envoi (OutboxMail).
    await db.outboxMail.create({ data: { toEmail: email, subject: "Réinitialisation de votre mot de passe", body: `Cliquez sur ce lien (valable 1 heure) : ${link}` } });
    if (process.env.NODE_ENV !== "production") devLink = link;
  }
  // Réponse identique que le compte existe ou non (aucune divulgation)
  return json({ ok: true, devLink });
});
