import "server-only";
import crypto from "node:crypto";
import { db } from "../db";
import type { CreatePaymentInput, CreatePaymentResult, GatewayStatus, PaymentGateway } from "./gateway";

/**
 * Passerelle de démonstration (aucune clé FedaPay configurée).
 * Le paiement reste « en attente » jusqu'à ce que l'utilisateur clique sur « Simuler la confirmation ».
 */
export class SimulatedGateway implements PaymentGateway {
  readonly name = "SIMULATED" as const;

  async createPayment(i: CreatePaymentInput): Promise<CreatePaymentResult> {
    return { gatewayTxId: `sim_${crypto.randomBytes(6).toString("hex")}`, status: "pending" };
  }

  async retrievePayment(id: string) {
    const p = await db.payment.findUnique({ where: { gatewayTxId: id }, include: { order: true } });
    const map: Record<string, GatewayStatus> = { PENDING: "pending", SUCCEEDED: "approved", FAILED: "declined", EXPIRED: "expired", REFUNDED: "refunded" };
    return { status: map[p?.status ?? "PENDING"], amount: p?.amountXof ?? 0, currency: "XOF", orderId: p?.orderId };
  }
}
