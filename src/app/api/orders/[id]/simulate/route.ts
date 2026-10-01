import { z } from "zod";
import { db } from "@/lib/db";
import { authed, fail, json, parse, route } from "@/lib/http";
import { applyGatewayStatus } from "@/lib/orders";
import { isDemoMode } from "@/lib/payments";

/** MODE DÉMO UNIQUEMENT : imite la notification « transaction.approved / declined » de la passerelle. */
export const POST = route<{ params: Promise<{ id: string }> }>(async (req, { params }) => {
  if (!isDemoMode()) return fail("Indisponible : une passerelle réelle est configurée.", 403);
  const user = await authed();
  const { outcome } = await parse(req, z.object({ outcome: z.enum(["approved", "declined"]) }));
  const order = await db.order.findFirst({ where: { id: (await params).id, userId: user.id } });
  if (!order) return fail("Commande introuvable.", 404);
  const p = await db.payment.findFirst({ where: { orderId: order.id, status: "PENDING", gateway: "SIMULATED" }, orderBy: { createdAt: "desc" } });
  if (!p?.gatewayTxId) return fail("Aucun paiement en attente.", 409);
  await applyGatewayStatus(p.gatewayTxId, outcome, p.amountXof, "XOF");
  return json({ ok: true });
});
