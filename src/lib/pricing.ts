export interface PromoLike {
  kind: string; value: number; minAmountXof: number | null;
  startsAt: Date | null; endsAt: Date | null; isActive: boolean;
  maxUses: number | null; maxUsesPerUser: number;
}

export type PromoCheck =
  | { ok: true; discount: number }
  | { ok: false; reason: "inactive" | "not_started" | "expired" | "min_amount" | "max_uses" | "user_limit" };

/** Calcule la remise (en FCFA entiers) ou renvoie la raison du refus. */
export function evaluatePromo(p: PromoLike, base: number, now: Date, totalUses: number, userUses: number): PromoCheck {
  if (!p.isActive) return { ok: false, reason: "inactive" };
  if (p.startsAt && now < p.startsAt) return { ok: false, reason: "not_started" };
  if (p.endsAt && now > p.endsAt) return { ok: false, reason: "expired" };
  if (p.minAmountXof && base < p.minAmountXof) return { ok: false, reason: "min_amount" };
  if (p.maxUses !== null && totalUses >= p.maxUses) return { ok: false, reason: "max_uses" };
  if (userUses >= p.maxUsesPerUser) return { ok: false, reason: "user_limit" };
  const raw = p.kind === "PERCENT" ? Math.floor((base * Math.min(100, p.value)) / 100) : p.value;
  return { ok: true, discount: Math.max(0, Math.min(base, raw)) };
}

export const PROMO_MESSAGES: Record<string, string> = {
  inactive: "Ce code n’est plus actif.",
  not_started: "Ce code n’est pas encore valable.",
  expired: "Ce code a expiré.",
  min_amount: "Le montant minimum n’est pas atteint pour ce code.",
  max_uses: "Ce code a atteint sa limite d’utilisation.",
  user_limit: "Vous avez déjà utilisé ce code.",
  unknown: "Code promo invalide.",
};

export const formatXof = (n: number) => `${new Intl.NumberFormat("fr-FR").format(n).replace(/\u202f|\u00a0/g, " ")} FCFA`;
