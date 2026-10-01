import { db } from "@/lib/db";
import { authed, fail, json, route } from "@/lib/http";

export const GET = route<{ params: Promise<{ id: string }> }>(async (_req, { params }) => {
  const user = await authed();
  const o = await db.order.findFirst({ where: { id: (await params).id, userId: user.id }, include: { payments: { orderBy: { createdAt: "desc" }, take: 1 } } });
  if (!o) return fail("Commande introuvable.", 404);
  return json({ status: o.status, paymentStatus: o.payments[0]?.status ?? null });
});
