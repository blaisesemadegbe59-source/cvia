import { Webhook } from "fedapay";
import { db } from "@/lib/db";
import { applyGatewayStatus } from "@/lib/orders";
import type { GatewayStatus } from "@/lib/payments/gateway";

export const dynamic = "force-dynamic";

/**
 * Webhook FedaPay. Signature vérifiée sur le corps BRUT (en-tête X-FEDAPAY-SIGNATURE).
 * Idempotent : un même événement (nom + id d'objet) n'est traité qu'une fois.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const sig = req.headers.get("x-fedapay-signature") ?? "";
  const secret = process.env.FEDAPAY_WEBHOOK_SECRET ?? "";
  let event: { name: string; entity: { id: number | string; status?: string; amount?: number; currency?: { iso?: string } } };
  try {
    event = Webhook.constructEvent(raw, sig, secret) as never;
  } catch {
    return new Response("invalid signature", { status: 400 });
  }
  const objectId = String(event.entity?.id ?? "");
  try {
    const exists = await db.webhookEvent.findUnique({ where: { gateway_eventName_objectId: { gateway: "FEDAPAY", eventName: event.name, objectId } } });
    if (exists?.processedAt) return new Response("ok", { status: 200 });
    const rec = exists ?? (await db.webhookEvent.create({ data: { gateway: "FEDAPAY", eventName: event.name, objectId, payload: raw } }));
    const map: Record<string, GatewayStatus> = {
      "transaction.approved": "approved", "transaction.transferred": "approved", "transaction.declined": "declined",
      "transaction.canceled": "canceled", "transaction.updated": (event.entity.status as GatewayStatus) ?? "pending",
    };
    const status = map[event.name];
    if (status) await applyGatewayStatus(objectId, status, Number(event.entity.amount ?? 0), event.entity.currency?.iso ?? "XOF");
    await db.webhookEvent.update({ where: { id: rec.id }, data: { processedAt: new Date() } });
  } catch (e) {
    console.error("[webhook]", e);
    return new Response("error", { status: 500 }); // FedaPay réessaiera (9 tentatives)
  }
  return new Response("ok", { status: 200 });
}
