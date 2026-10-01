import { z } from "zod";
import { db } from "@/lib/db";
import { createSession, hashPassword, newReferralCode, passwordIssue, clientIp } from "@/lib/auth";
import { fail, json, parse, route } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { normalizePhone } from "@/lib/phone";

const schema = z.object({
  name: z.string().trim().min(2, "Veuillez indiquer votre nom.").max(80),
  email: z.string().trim().toLowerCase().email("Adresse e-mail invalide."),
  password: z.string().max(200),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  ref: z.string().trim().max(20).optional().or(z.literal("")),
});

export const POST = route(async (req) => {
  const ip = await clientIp();
  const rl = rateLimit(`register:${ip}`, 10, 3600_000);
  if (!rl.ok) return fail("Trop de tentatives. Réessayez plus tard.", 429);
  const d = await parse(req, schema);
  const issue = passwordIssue(d.password);
  if (issue) return fail(issue, 422);
  let phone: string | null = null;
  if (d.phone) {
    phone = normalizePhone(d.phone);
    if (!phone) return fail("Numéro de téléphone invalide.", 422);
  }
  if (await db.user.findUnique({ where: { email: d.email } })) return fail("Un compte existe déjà avec cet e-mail.", 409);
  if (phone && (await db.user.findUnique({ where: { phone } }))) return fail("Un compte existe déjà avec ce numéro.", 409);
  const referrer = d.ref ? await db.user.findUnique({ where: { referralCode: d.ref.toUpperCase() } }) : null;
  const user = await db.user.create({
    data: { email: d.email, name: d.name, phone, passwordHash: hashPassword(d.password), referralCode: newReferralCode(), referredById: referrer?.id ?? null },
  });
  await db.notification.create({ data: { userId: user.id, kind: "WELCOME", title: "Bienvenue sur Cvia 👋", body: "Créez votre premier CV en quelques minutes. L’aperçu et la sauvegarde sont gratuits." } });
  await createSession(user.id);
  return json({ ok: true }, 201);
});
