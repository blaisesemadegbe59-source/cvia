import "server-only";
import { FedaPayGateway, fedapayConfigured } from "./fedapay";
import { SimulatedGateway } from "./simulated";
import type { PaymentGateway } from "./gateway";

export const isDemoMode = () => !fedapayConfigured();
export function getGateway(): PaymentGateway {
  return fedapayConfigured() ? new FedaPayGateway() : new SimulatedGateway();
}
