import "server-only";

export type GatewayStatus = "pending" | "approved" | "declined" | "canceled" | "refunded" | "expired" | "transferred";

export interface CreatePaymentInput {
  orderId: string;
  orderNumber: string;
  amountXof: number;
  description: string;
  customer: { name: string; email?: string | null; phone?: string | null };
  /** mtn_open | moov | sbin (sans redirection) ou "card" (page hébergée) */
  mode: string;
  callbackUrl: string;
}
export interface CreatePaymentResult {
  gatewayTxId: string;
  /** Si défini : rediriger le navigateur (cartes, autres moyens). */
  redirectUrl?: string;
  status: GatewayStatus;
}

export interface PaymentGateway {
  readonly name: "FEDAPAY" | "SIMULATED";
  createPayment(input: CreatePaymentInput): Promise<CreatePaymentResult>;
  retrievePayment(gatewayTxId: string): Promise<{ status: GatewayStatus; amount: number; currency: string; orderId?: string }>;
}
