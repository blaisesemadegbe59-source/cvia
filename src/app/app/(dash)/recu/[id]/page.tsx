import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatXof } from "@/lib/pricing";
import { APP_NAME } from "@/components/Logo";
import { PrintButton } from "@/components/PrintButton";

export const metadata = { title: "Reçu" };

export default async function Receipt({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/app/recu/${id}`);
  const o = await db.order.findFirst({ where: { id, userId: user.id, status: { in: ["PAID", "REFUNDED"] } } });
  if (!o) notFound();
  const [p, payment] = await Promise.all([db.product.findUnique({ where: { code: o.productCode } }), db.payment.findFirst({ where: { orderId: o.id, status: { in: ["SUCCEEDED", "REFUNDED"] } } })]);
  const fmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "short" });
  return (
    <div className="mx-auto max-w-xl">
      <div className="card p-8 print:border-0 print:shadow-none">
        <div className="flex items-start justify-between"><div><p className="font-display text-2xl font-extrabold text-brand-800">{APP_NAME}</p><p className="text-sm text-stone-500">Reçu de paiement</p></div><div className="text-right text-sm"><p className="font-mono font-bold">{o.number}</p><p className="text-stone-500">{o.paidAt ? fmt.format(o.paidAt) : ""}</p></div></div>
        <hr className="my-6 border-stone-200" />
        <p className="text-sm text-stone-500">Client</p><p className="font-semibold">{user.name} — {user.email}</p>
        <table className="mt-6 w-full text-sm"><tbody className="divide-y divide-stone-100">
          <tr><td className="py-3">{p?.name ?? o.productCode}</td><td className="py-3 text-right">{formatXof(o.baseAmountXof)}</td></tr>
          {o.discountXof > 0 && <tr><td className="py-3 text-brand-700">Réduction</td><td className="py-3 text-right text-brand-700">−{formatXof(o.discountXof)}</td></tr>}
          <tr><td className="py-3 text-base font-bold">Total payé</td><td className="py-3 text-right text-base font-extrabold">{formatXof(o.totalXof)}</td></tr>
        </tbody></table>
        <p className="mt-6 text-xs text-stone-500">Moyen : {payment?.mode ?? "—"} · Référence : {payment?.gatewayTxId ?? "—"}{o.status === "REFUNDED" ? " · REMBOURSÉ" : ""}</p>
      </div>
      <div className="mt-5 text-center print:hidden"><PrintButton /></div>
    </div>
  );
}
