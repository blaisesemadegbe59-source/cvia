import { z } from "zod";
import { db } from "@/lib/db";
import { authed, fail, json, parse, route } from "@/lib/http";
import { evaluatePromo, PROMO_MESSAGES } from "@/lib/pricing";

export const POST = route(async (req) => {
  const user = await authed();
  const { code, productCode } = await parse(req, z.object({ code: z.string().trim().min(1).max(30), productCode: z.string().max(30) }));
  const [product, p] = await Promise.all([
    db.product.findUnique({ where: { code: productCode } }),
    db.promoCode.findUnique({ where: { code: code.toUpperCase() } }),
  ]);
  if (!product || !p) return fail(PROMO_MESSAGES.unknown, 404);
  const [total, mine] = await Promise.all([db.promoRedemption.count({ where: { promoCodeId: p.id } }), db.promoRedemption.count({ where: { promoCodeId: p.id, userId: user.id } })]);
  const r = evaluatePromo(p, product.priceXof, new Date(), total, mine);
  if (!r.ok) return fail(PROMO_MESSAGES[r.reason], 422);
  return json({ discount: r.discount, total: product.priceXof - r.discount });
});
