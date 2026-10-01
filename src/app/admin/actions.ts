"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { audit, isAdmin, requireAdmin } from "@/lib/auth";
import { fulfillOrder, refundOrder as doRefund, reconcilePending } from "@/lib/orders";
import { setSetting, SETTING_DEFAULTS, type SettingKey } from "@/lib/settings";
import { addMonths } from "@/lib/access";

async function admin() {
  const u = await requireAdmin();
  if (!isAdmin(u)) throw new Error("Droits insuffisants.");
  return u;
}

export async function toggleUser(id: string) {
  const a = await admin();
  if (id === a.id) return;
  const u = await db.user.findUnique({ where: { id } });
  if (!u || u.role !== "CANDIDATE") return;
  const status = u.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
  await db.user.update({ where: { id }, data: { status } });
  await audit(a.id, status === "SUSPENDED" ? "USER_SUSPENDED" : "USER_REACTIVATED", "User", id);
  revalidatePath("/admin/utilisateurs");
}

export async function grantCredits(formData: FormData) {
  const a = await admin();
  const d = z.object({ userId: z.string(), n: z.coerce.number().int().min(1).max(20) }).parse(Object.fromEntries(formData));
  await db.creditLedger.create({ data: { userId: d.userId, delta: d.n, reason: "ADMIN", expiresAt: addMonths(new Date(), 12) } });
  await audit(a.id, "CREDITS_GRANTED", "User", d.userId, { n: d.n });
  revalidatePath("/admin/utilisateurs");
}

export async function refundOrderAction(id: string) {
  const a = await admin();
  await doRefund(id);
  await audit(a.id, "ORDER_REFUNDED", "Order", id);
  revalidatePath("/admin/commandes");
}

export async function approveOrderManually(id: string) {
  const a = await admin();
  await db.payment.updateMany({ where: { orderId: id, status: { in: ["REVIEW", "PENDING"] } }, data: { status: "SUCCEEDED" } });
  await fulfillOrder(id);
  await audit(a.id, "ORDER_MANUALLY_APPROVED", "Order", id);
  revalidatePath("/admin/commandes");
}

export async function reconcileNow() {
  const a = await admin();
  const n = await reconcilePending(0);
  await audit(a.id, "RECONCILE", "Payment", undefined, { n });
  revalidatePath("/admin/commandes");
}

export async function setPrice(formData: FormData) {
  const a = await admin();
  const d = z.object({ code: z.string(), price: z.coerce.number().int().min(0).max(1_000_000) }).parse(Object.fromEntries(formData));
  const before = await db.product.findUnique({ where: { code: d.code } });
  await db.product.update({ where: { code: d.code }, data: { priceXof: d.price } });
  await audit(a.id, "PRICE_CHANGED", "Product", d.code, { from: before?.priceXof, to: d.price });
  revalidatePath("/admin/offres");
}
export async function toggleProduct(code: string) {
  const a = await admin();
  const p = await db.product.findUnique({ where: { code } });
  if (!p) return;
  await db.product.update({ where: { code }, data: { isActive: !p.isActive } });
  await audit(a.id, "PRODUCT_TOGGLED", "Product", code);
  revalidatePath("/admin/offres");
}

export async function createPromo(formData: FormData) {
  const a = await admin();
  const d = z.object({
    code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,20}$/), kind: z.enum(["PERCENT", "FIXED"]), value: z.coerce.number().int().min(1).max(100000),
    maxUses: z.coerce.number().int().min(1).optional().or(z.literal("").transform(() => undefined)),
  }).parse(Object.fromEntries(formData));
  if (d.kind === "PERCENT" && d.value > 100) return;
  await db.promoCode.create({ data: { code: d.code, kind: d.kind, value: d.value, maxUses: d.maxUses ?? null } });
  await audit(a.id, "PROMO_CREATED", "PromoCode", d.code);
  revalidatePath("/admin/offres");
}
export async function togglePromo(id: string) {
  const a = await admin();
  const p = await db.promoCode.findUnique({ where: { id } });
  if (!p) return;
  await db.promoCode.update({ where: { id }, data: { isActive: !p.isActive } });
  await audit(a.id, "PROMO_TOGGLED", "PromoCode", p.code);
  revalidatePath("/admin/offres");
}

export async function toggleTemplate(id: string) {
  const a = await admin();
  const t = await db.template.findUnique({ where: { id } });
  if (!t) return;
  await db.template.update({ where: { id }, data: { isActive: !t.isActive } });
  await audit(a.id, "TEMPLATE_TOGGLED", "Template", t.slug);
  revalidatePath("/admin/modeles");
}

export async function setMessageStatus(id: string, status: string) {
  const a = await admin();
  await db.contactMessage.update({ where: { id }, data: { status } });
  await audit(a.id, "MESSAGE_STATUS", "ContactMessage", id, { status });
  revalidatePath("/admin/messages");
}

export async function saveSettings(formData: FormData) {
  const a = await admin();
  for (const key of Object.keys(SETTING_DEFAULTS) as SettingKey[]) {
    const def = SETTING_DEFAULTS[key]; const raw = formData.get(key);
    if (typeof def === "boolean") await setSetting(key, raw === "on");
    else if (typeof def === "number") { const n = Number(raw); if (Number.isFinite(n) && n >= 0) await setSetting(key, Math.floor(n)); }
    else if (typeof raw === "string") await setSetting(key, raw.trim().slice(0, 300));
  }
  await audit(a.id, "SETTINGS_SAVED", "Setting");
  revalidatePath("/admin/reglages");
}
