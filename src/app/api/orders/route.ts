import { z } from "zod";
import { authed, json, parse, route } from "@/lib/http";
import { createOrder } from "@/lib/orders";

const schema = z.object({ productCode: z.string().max(30), cvId: z.string().nullish(), promo: z.string().max(30).nullish() });

export const POST = route(async (req) => {
  const user = await authed();
  const d = await parse(req, schema);
  const order = await createOrder(user.id, d.productCode, d.cvId, d.promo);
  return json({ id: order.id, status: order.status }, 201);
});
