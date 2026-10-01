import { z } from "zod";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/auth";
import { fail, json, parse, route } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({
  name: z.string().trim().min(2, "Indiquez votre nom.").max(80),
  email: z.string().trim().email("E-mail invalide.").max(120).optional().or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  subject: z.string().trim().min(3, "Indiquez un sujet.").max(120),
  body: z.string().trim().min(10, "Votre message est trop court.").max(3000),
  website: z.string().max(0).optional(), // champ piège anti-robot
});

export const POST = route(async (req) => {
  if (!rateLimit(`contact:${await clientIp()}`, 5, 3600_000).ok) return fail("Trop de messages envoyés. Réessayez plus tard.", 429);
  const d = await parse(req, schema);
  if (!d.email && !d.phone) return fail("Laissez un e-mail ou un numéro pour que nous puissions vous répondre.", 422);
  await db.contactMessage.create({ data: { name: d.name, email: d.email || null, phone: d.phone || null, subject: d.subject, body: d.body } });
  return json({ ok: true }, 201);
});
