import { z } from "zod";
import { authed, baseUrl, fail, json, parse, route } from "@/lib/http";
import { startPayment } from "@/lib/orders";
import { normalizePhone } from "@/lib/phone";
import { rateLimit } from "@/lib/rate-limit";

const schema = z.object({ mode: z.enum(["mtn_open", "moov", "sbin", "card"]), phone: z.string().max(30).optional().or(z.literal("")) });

export const POST = route<{ params: Promise<{ id: string }> }>(async (req, { params }) => {
  const user = await authed();
  const d = await parse(req, schema);
  if (!rateLimit(`pay:${user.id}`, 10, 3600_000).ok) return fail("Trop de tentatives de paiement. Réessayez plus tard.", 429);
  let phone: string | null = null;
  if (d.mode !== "card") {
    phone = d.phone ? normalizePhone(d.phone) : null;
    if (!phone) return fail("Numéro Mobile Money invalide. Exemple : 01 97 00 00 00.", 422);
  }
  const res = await startPayment((await params).id, user.id, d.mode, phone, baseUrl(req));
  return json(res);
});
