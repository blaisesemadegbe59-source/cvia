import Link from "next/link";
import { db } from "@/lib/db";
import { formatXof } from "@/lib/pricing";
import { approveOrderManually, reconcileNow, refundOrderAction } from "../../actions";
import { STATUS } from "@/lib/status";

export const dynamic = "force-dynamic";

export default async function Orders({ searchParams }: { searchParams: Promise<{ filtre?: string }> }) {
  const { filtre } = await searchParams;
  const orders = await db.order.findMany({
    where: filtre === "REVIEW" ? { payments: { some: { status: "REVIEW" } } } : filtre ? { status: filtre } : undefined,
    orderBy: { createdAt: "desc" }, take: 100, include: { user: { select: { name: true, email: true } }, payments: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  const fmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "short" });
  const filters = [["", "Toutes"], ["PAID", "Payées"], ["PENDING_PAYMENT", "En attente"], ["FAILED", "Échouées"], ["REVIEW", "À examiner"], ["REFUNDED", "Remboursées"]];
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-extrabold">Commandes</h1>
        <form action={reconcileNow}><button className="btn btn-outline btn-sm">Rapprocher les paiements en attente</button></form>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">{filters.map(([k, l]) => <Link key={k} href={k ? `?filtre=${k}` : "?"} className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${(filtre ?? "") === k ? "bg-stone-900 text-white" : "bg-white text-stone-600 ring-1 ring-stone-200 hover:bg-stone-50"}`}>{l}</Link>)}</div>
      <div className="card mt-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-500"><tr><th className="px-4 py-3">N°</th><th className="px-4 py-3">Client</th><th className="px-4 py-3">Offre</th><th className="px-4 py-3">Date</th><th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3">Passerelle</th><th className="px-4 py-3" /></tr></thead>
          <tbody className="divide-y divide-stone-100">
            {orders.map((o) => {
              const p = o.payments[0];
              return (
                <tr key={o.id}>
                  <td className="px-4 py-3 font-mono text-xs">{o.number}</td>
                  <td className="px-4 py-3"><p className="font-medium">{o.user.name}</p><p className="text-xs text-stone-500">{o.user.email}</p></td>
                  <td className="px-4 py-3">{o.productCode}</td><td className="px-4 py-3 text-stone-600">{fmt.format(o.createdAt)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatXof(o.totalXof)}</td>
                  <td className="px-4 py-3"><span className={`badge ${STATUS[o.status]?.[1]}`}>{STATUS[o.status]?.[0] ?? o.status}</span></td>
                  <td className="px-4 py-3 text-xs text-stone-500">{p ? <>{p.gateway} · {p.mode}<br />{p.status}{p.lastError ? <span className="block max-w-[220px] text-red-600">{p.lastError}</span> : null}</> : "—"}</td>
                  <td className="px-4 py-3"><div className="flex gap-2">
                    {o.status === "PAID" && <form action={refundOrderAction.bind(null, o.id)}><button className="btn btn-outline btn-sm">Rembourser</button></form>}
                    {o.status !== "PAID" && o.status !== "REFUNDED" && p && <form action={approveOrderManually.bind(null, o.id)}><button className="btn btn-primary btn-sm">Valider</button></form>}
                  </div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-xs text-stone-500">« Rembourser » marque la commande comme remboursée et retire les droits associés ; le remboursement d’argent s’effectue ensuite depuis le tableau de bord FedaPay.</p>
    </div>
  );
}
