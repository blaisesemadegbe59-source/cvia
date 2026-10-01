import "server-only";
import { FedaPay, Transaction } from "fedapay";
import type { CreatePaymentInput, CreatePaymentResult, GatewayStatus, PaymentGateway } from "./gateway";

/** Normalise un numéro béninois : 8 chiffres historiques ou 10 chiffres (préfixe 01 depuis le 30/11/2024). */
export function beninLocalNumber(phone: string): string {
  const d = phone.replace(/\D/g, "").replace(/^229/, "");
  return d.length === 10 && d.startsWith("01") ? d : d.length === 8 ? d : d;
}

function configure() {
  FedaPay.setApiKey(process.env.FEDAPAY_SECRET_KEY || "");
  FedaPay.setEnvironment(process.env.FEDAPAY_ENV === "live" ? "live" : "sandbox");
}

export const fedapayConfigured = () => Boolean(process.env.FEDAPAY_SECRET_KEY);

export class FedaPayGateway implements PaymentGateway {
  readonly name = "FEDAPAY" as const;

  async createPayment(i: CreatePaymentInput): Promise<CreatePaymentResult> {
    configure();
    const [firstname, ...rest] = i.customer.name.split(" ");
    const phone = i.customer.phone ? { number: beninLocalNumber(i.customer.phone), country: "BJ" } : undefined;
    const tx = await Transaction.create({
      description: i.description,
      amount: i.amountXof,
      currency: { iso: "XOF" },
      callback_url: i.callbackUrl,
      merchant_reference: i.orderNumber,
      custom_metadata: { orderId: i.orderId },
      customer: { firstname, lastname: rest.join(" ") || firstname, email: i.customer.email ?? undefined, phone_number: phone },
    } as never);
    const token = await tx.generateToken();
    const id = String((tx as unknown as { id: number }).id);
    if (["mtn_open", "moov", "sbin"].includes(i.mode)) {
      // Paiement sans redirection : l'utilisateur confirme sur son téléphone.
      await tx.sendNowWithToken(i.mode, token.token, phone as never);
      return { gatewayTxId: id, status: "pending" };
    }
    return { gatewayTxId: id, redirectUrl: token.url, status: "pending" };
  }

  async retrievePayment(id: string) {
    configure();
    const tx = (await Transaction.retrieve(id)) as unknown as {
      status: GatewayStatus; amount: number; currency?: { iso?: string }; custom_metadata?: { orderId?: string };
    };
    return { status: tx.status, amount: tx.amount, currency: tx.currency?.iso ?? "XOF", orderId: tx.custom_metadata?.orderId };
  }
}
