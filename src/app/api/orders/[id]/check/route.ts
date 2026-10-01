import { db } from "@/lib/db";
import { authed, fail, json, route } from "@/lib/http";
import { applyGatewayStatus } from "@/lib/orders";
import { getGateway } from "@/lib/payments";

/** Vérification active auprès de la passerelle (retour de redirection, ou bouton « J’ai payé »). */
export const POST = route<{ params: Promise<{ id: string }> }>(async (_req, { params }) => {
  const user = await authed();
  const o = await db.order.findFirst({ where: { id: (await params).id, userId: user.id }, include: { payments: { where: { status: "PENDING" }, orderBy: { createdAt: "desc" } } } });
  if (!o) return fail("Commande introuvable.", 404);
  if (o.status !== "PAID") {
    const gw = getGateway();
    for (const p of o.payments) {
      if (p.gateway !== "FEDAPAY" || !p.gatewayTxId) continue;
      try {
        const r = await gw.retrievePayment(p.gatewayTxId);
        await applyGatewayStatus(p.gatewayTxId, r.status, r.amount, r.currency);
      } catch (e) { console.error("[check]", e); }
    }
  }
  const fresh = await db.order.findUnique({ where: { id: o.id } });
  return json({ status: fresh?.status });
});
