import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "./db";
import { addDays, addMonths } from "./access";
import { evaluatePromo, PROMO_MESSAGES } from "./pricing";
import { getSettings } from "./settings";
import { getGateway, isDemoMode } from "./payments";
import type { GatewayStatus } from "./payments/gateway";

export class OrderError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

async function nextNumber(tx: Prisma.TransactionClient | typeof db) {
  const year = new Date().getFullYear();
  const count = await tx.order.count();
  return `CV-${year}-${String(count + 1).padStart(6, "0")}`;
}

/* ---------------- pass / crédits ---------------- */
export async function activePass(userId: string, now = new Date()) {
  return db.entitlement.findFirst({
    where: { userId, type: "PASS", revokedAt: null, startsAt: { lte: now }, endsAt: { gt: now } },
    orderBy: { endsAt: "desc" },
  });
}
export async function creditBalance(userId: string, now = new Date()) {
  const rows = await db.creditLedger.findMany({ where: { userId } });
  // Les crédits expirés sont ignorés : on regroupe les entrées positives non expirées, moins les consommations.
  let positive = 0, negative = 0;
  for (const r of rows) {
    if (r.delta > 0 && (!r.expiresAt || r.expiresAt > now)) positive += r.delta;
    if (r.delta < 0) negative += -r.delta;
  }
  return Math.max(0, positive - negative);
}

/* ---------------- création de commande ---------------- */
export async function createOrder(userId: string, productCode: string, targetCvId?: string | null, promoCode?: string | null) {
  const product = await db.product.findUnique({ where: { code: productCode } });
  if (!product || !product.isActive) throw new OrderError("Offre indisponible.", 404);
  const needsCv = ["CV_SINGLE", "CV_REACTIVATE"].includes(productCode);
  if (needsCv) {
    const cv = targetCvId ? await db.cv.findFirst({ where: { id: targetCvId, userId } }) : null;
    if (!cv) throw new OrderError("CV introuvable.", 404);
    if (productCode === "CV_REACTIVATE" && !cv.unlockedAt) throw new OrderError("Ce CV n’a pas encore été débloqué.");
  }

  let discount = 0;
  let promoId: string | null = null;
  if (promoCode?.trim()) {
    const p = await db.promoCode.findUnique({ where: { code: promoCode.trim().toUpperCase() } });
    if (!p) throw new OrderError(PROMO_MESSAGES.unknown);
    const [total, mine] = await Promise.all([
      db.promoRedemption.count({ where: { promoCodeId: p.id } }),
      db.promoRedemption.count({ where: { promoCodeId: p.id, userId } }),
    ]);
    const r = evaluatePromo(p, product.priceXof, new Date(), total, mine);
    if (!r.ok) throw new OrderError(PROMO_MESSAGES[r.reason]);
    discount = r.discount;
    promoId = p.id;
  }

  const order = await db.order.create({
    data: {
      number: await nextNumber(db),
      userId, productCode, targetCvId: needsCv ? targetCvId : null,
      baseAmountXof: product.priceXof, discountXof: discount, totalXof: product.priceXof - discount,
      promoCodeId: promoId, status: "CREATED", expiresAt: addDays(new Date(), 1),
    },
  });
  if (order.totalXof === 0) return fulfillOrder(order.id); // commande gratuite : pas de passerelle
  return order;
}

/* ---------------- lancement du paiement ---------------- */
export async function startPayment(orderId: string, userId: string, mode: string, phone: string | null, baseUrl: string) {
  const order = await db.order.findFirst({ where: { id: orderId, userId }, include: { user: true } });
  if (!order) throw new OrderError("Commande introuvable.", 404);
  if (order.status === "PAID") throw new OrderError("Cette commande est déjà payée.");
  if (order.expiresAt < new Date()) {
    await db.order.update({ where: { id: order.id }, data: { status: "EXPIRED" } });
    throw new OrderError("Cette commande a expiré, veuillez en créer une nouvelle.");
  }
  const pending = await db.payment.findFirst({ where: { orderId, status: "PENDING", createdAt: { gt: new Date(Date.now() - 2 * 60_000) } } });
  if (pending && ["mtn_open", "moov", "sbin"].includes(mode)) {
    throw new OrderError("Un paiement est déjà en cours. Confirmez-le sur votre téléphone ou patientez 2 minutes avant de réessayer.");
  }
  const gw = getGateway();
  const product = await db.product.findUnique({ where: { code: order.productCode } });
  const res = await gw.createPayment({
    orderId: order.id, orderNumber: order.number, amountXof: order.totalXof,
    description: `${product?.name ?? order.productCode} — ${order.number}`,
    customer: { name: order.user.name || "Client", email: order.user.email, phone: phone ?? order.user.phone },
    mode, callbackUrl: `${baseUrl}/app/paiement/${order.id}`,
  });
  await db.$transaction([
    db.payment.create({ data: { orderId, gateway: gw.name, gatewayTxId: res.gatewayTxId, mode, phone, amountXof: order.totalXof, status: "PENDING" } }),
    db.order.update({ where: { id: orderId }, data: { status: "PENDING_PAYMENT" } }),
  ]);
  return { redirectUrl: res.redirectUrl ?? null, demo: isDemoMode() };
}

/* ---------------- application d'un statut de passerelle ---------------- */
const STATUS_MAP: Record<GatewayStatus, string> = {
  pending: "PENDING", approved: "SUCCEEDED", declined: "FAILED", canceled: "FAILED",
  refunded: "REFUNDED", expired: "EXPIRED", transferred: "SUCCEEDED",
};

export async function applyGatewayStatus(gatewayTxId: string, status: GatewayStatus, amount: number, currency: string) {
  const payment = await db.payment.findUnique({ where: { gatewayTxId }, include: { order: true } });
  if (!payment) return { ok: false as const, reason: "payment_not_found" };
  const next = STATUS_MAP[status];

  if (next === "SUCCEEDED") {
    if (amount !== payment.order.totalXof || currency !== "XOF") {
      // PAY-05 : écart de montant -> à examiner, aucun droit accordé
      await db.payment.update({ where: { id: payment.id }, data: { status: "REVIEW", lastError: `Montant reçu ${amount} ${currency} ≠ ${payment.order.totalXof} XOF` } });
      return { ok: false as const, reason: "amount_mismatch" };
    }
    await db.payment.update({ where: { id: payment.id }, data: { status: "SUCCEEDED" } });
    await fulfillOrder(payment.orderId);
    return { ok: true as const };
  }
  if (next === "REFUNDED") { await refundOrder(payment.orderId); return { ok: true as const }; }
  if (payment.status === "SUCCEEDED") return { ok: true as const }; // ne jamais rétrograder un paiement réussi
  await db.payment.update({ where: { id: payment.id }, data: { status: next } });
  if (next === "FAILED" || next === "EXPIRED") {
    const stillOpen = await db.payment.count({ where: { orderId: payment.orderId, status: "PENDING" } });
    if (!stillOpen && payment.order.status !== "PAID") {
      await db.order.update({ where: { id: payment.orderId }, data: { status: next === "EXPIRED" ? "EXPIRED" : "FAILED" } });
    }
  }
  return { ok: true as const };
}

/* ---------------- octroi des droits (idempotent) ---------------- */
export async function fulfillOrder(orderId: string) {
  const s = await getSettings();
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order) throw new OrderError("Commande introuvable.", 404);
    if (order.status === "PAID") return order; // idempotence : déjà traité
    if (order.status === "REFUNDED") return order;
    const now = new Date();
    const product = await tx.product.findUnique({ where: { code: order.productCode } });

    switch (order.productCode) {
      case "CV_SINGLE": {
        const cv = order.targetCvId ? await tx.cv.findUnique({ where: { id: order.targetCvId } }) : null;
        if (cv) {
          await tx.cv.update({ where: { id: cv.id }, data: { unlockedAt: cv.unlockedAt ?? now, editableUntil: addDays(now, s.editWindowDays) } });
        }
        break;
      }
      case "CV_REACTIVATE": {
        const cv = order.targetCvId ? await tx.cv.findUnique({ where: { id: order.targetCvId } }) : null;
        if (cv) {
          const from = cv.editableUntil && cv.editableUntil > now ? cv.editableUntil : now;
          await tx.cv.update({ where: { id: cv.id }, data: { editableUntil: addDays(from, product?.durationDays ?? 30) } });
        }
        break;
      }
      case "CV_PACK_3": {
        await tx.creditLedger.create({
          data: { userId: order.userId, delta: product?.credits ?? 3, reason: "PACK", orderId: order.id, expiresAt: addMonths(now, s.creditsValidityMonths) },
        });
        break;
      }
      case "PASS_30":
      case "PASS_90": {
        const last = await tx.entitlement.findFirst({ where: { userId: order.userId, type: "PASS", revokedAt: null, endsAt: { gt: now } }, orderBy: { endsAt: "desc" } });
        const start = last ? last.endsAt : now; // les passes s'additionnent
        await tx.entitlement.create({
          data: { userId: order.userId, type: "PASS", orderId: order.id, startsAt: start, endsAt: addDays(start, product?.durationDays ?? 30) },
        });
        break;
      }
    }

    if (order.promoCodeId) {
      await tx.promoRedemption.create({ data: { promoCodeId: order.promoCodeId, userId: order.userId, orderId: order.id } }).catch(() => undefined);
    }

    const paid = await tx.order.update({ where: { id: order.id }, data: { status: "PAID", paidAt: now } });

    // Parrainage : récompense au premier achat d'un filleul
    const user = await tx.user.findUnique({ where: { id: order.userId } });
    if (s.referralEnabled && user?.referredById && order.totalXof > 0) {
      const prior = await tx.order.count({ where: { userId: user.id, status: "PAID", id: { not: order.id }, totalXof: { gt: 0 } } });
      const given = await tx.creditLedger.count({ where: { userId: user.referredById, reason: "REFERRAL" } });
      if (prior === 0 && given < s.referralMaxRewards) {
        await tx.creditLedger.create({
          data: { userId: user.referredById, delta: s.referralReward, reason: "REFERRAL", orderId: order.id, expiresAt: addMonths(now, s.creditsValidityMonths) },
        });
        await tx.notification.create({ data: { userId: user.referredById, kind: "REFERRAL", title: "Parrainage récompensé", body: `Un filleul a effectué son premier achat : +${s.referralReward} crédit de CV offert.` } });
      }
    }

    await tx.notification.create({
      data: { userId: order.userId, kind: "PAYMENT", title: "Paiement confirmé", body: `Reçu n° ${order.number} — ${product?.name ?? order.productCode}.` },
    });
    return paid;
  });
}

/* ---------------- remboursement (décision admin) ---------------- */
export async function refundOrder(orderId: string) {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId } });
    if (!order || order.status === "REFUNDED") return order;
    const now = new Date();
    await tx.entitlement.updateMany({ where: { orderId }, data: { revokedAt: now } });
    const credit = await tx.creditLedger.findFirst({ where: { orderId, reason: "PACK" } });
    if (credit) {
      await tx.creditLedger.create({ data: { userId: order.userId, delta: -credit.delta, reason: "REFUND", orderId } }).catch(() => undefined);
    }
    if (order.productCode === "CV_SINGLE" && order.targetCvId) {
      await tx.cv.updateMany({ where: { id: order.targetCvId }, data: { unlockedAt: null, editableUntil: null } });
    }
    await tx.payment.updateMany({ where: { orderId, status: "SUCCEEDED" }, data: { status: "REFUNDED" } });
    return tx.order.update({ where: { id: orderId }, data: { status: "REFUNDED" } });
  });
}

/* ---------------- déblocage par crédit ou pass ---------------- */
export async function unlockCv(userId: string, cvId: string) {
  const cv = await db.cv.findFirst({ where: { id: cvId, userId } });
  if (!cv) throw new OrderError("CV introuvable.", 404);
  const now = new Date();
  const s = await getSettings();
  if (await activePass(userId, now)) return { via: "pass" as const };
  if (cv.unlockedAt && cv.editableUntil && cv.editableUntil > now) return { via: "already" as const };
  if ((await creditBalance(userId, now)) < 1) throw new OrderError("Aucun crédit disponible.", 402);
  await db.$transaction([
    db.creditLedger.create({ data: { userId, delta: -1, reason: "UNLOCK", cvId } }),
    db.cv.update({ where: { id: cvId }, data: { unlockedAt: cv.unlockedAt ?? now, editableUntil: addDays(now, s.editWindowDays) } }),
  ]);
  return { via: "credit" as const };
}

/* ---------------- rapprochement des paiements en attente ---------------- */
export async function reconcilePending(olderThanMs = 2 * 60_000) {
  const list = await db.payment.findMany({ where: { status: "PENDING", gateway: "FEDAPAY", createdAt: { lt: new Date(Date.now() - olderThanMs) } }, take: 50 });
  const gw = getGateway();
  for (const p of list) {
    if (!p.gatewayTxId) continue;
    if (p.createdAt < new Date(Date.now() - 24 * 3600_000)) { await applyGatewayStatus(p.gatewayTxId, "expired", p.amountXof, "XOF"); continue; }
    try {
      const r = await gw.retrievePayment(p.gatewayTxId);
      await applyGatewayStatus(p.gatewayTxId, r.status, r.amount, r.currency);
    } catch { /* on réessaiera au prochain passage */ }
  }
  return list.length;
}
