import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { formatXof } from "@/lib/pricing";
import { STATUS } from "@/lib/status";

export const metadata = { title: "Mes paiements" };
export default async function Payments() {
  const user = await requireUser("/app/paiements");
  const orders = await db.order.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 50 });
  const products = await db.product.findMany();
  const names = Object.fromEntries(products.map((p) => [p.code, p.name]));
  const fmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" });
  return (
    <div>
      <h1 className="text-3xl font-extrabold text-stone-900">Mes paiements</h1>
      <div className="card mt-8 overflow-hidden">
        {orders.length === 0 ? <p className="p-10 text-center text-stone-500">Aucune commande pour le moment.</p> : (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead className="bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-500"><tr><th className="px-5 py-3">Commande</th><th className="px-5 py-3">Offre</th><th className="px-5 py-3">Date</th><th className="px-5 py-3 text-right">Montant</th><th className="px-5 py-3">Statut</th><th className="px-5 py-3" /></tr></thead>
            <tbody className="divide-y divide-stone-100">
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="px-5 py-4 font-mono text-xs">{o.number}</td><td className="px-5 py-4 font-medium">{names[o.productCode] ?? o.productCode}</td>
                  <td className="px-5 py-4 text-stone-600">{fmt.format(o.createdAt)}</td><td className="px-5 py-4 text-right font-semibold">{formatXof(o.totalXof)}</td>
                  <td className="px-5 py-4"><span className={`badge ${STATUS[o.status]?.[1]}`}>{STATUS[o.status]?.[0] ?? o.status}</span></td>
                  <td className="px-5 py-4 text-right">{o.status === "PAID" ? <Link href={`/app/recu/${o.id}`} className="font-semibold text-brand-700 hover:underline">Reçu</Link> : ["CREATED", "PENDING_PAYMENT", "FAILED"].includes(o.status) ? <Link href={`/app/paiement/${o.id}`} className="font-semibold text-brand-700 hover:underline">Payer</Link> : null}</td>
                </tr>
              ))}
            </tbody></table></div>
        )}
      </div>
    </div>
  );
}
