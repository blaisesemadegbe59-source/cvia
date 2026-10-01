import { db } from "@/lib/db";
import { formatXof } from "@/lib/pricing";
import { Users, FileText, Wallet, TrendingUp, AlertTriangle, Mail } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const since = new Date(Date.now() - 14 * 86_400_000);
  const [users, cvs, paid, revenue, review, newMsgs, buyers, recent] = await Promise.all([
    db.user.count({ where: { role: "CANDIDATE" } }),
    db.cv.count(),
    db.order.count({ where: { status: "PAID", totalXof: { gt: 0 } } }),
    db.order.aggregate({ where: { status: "PAID" }, _sum: { totalXof: true } }),
    db.payment.count({ where: { status: "REVIEW" } }),
    db.contactMessage.count({ where: { status: "NEW" } }),
    db.order.findMany({ where: { status: "PAID", totalXof: { gt: 0 } }, distinct: ["userId"], select: { userId: true } }),
    db.order.findMany({ where: { status: "PAID", paidAt: { gte: since } }, select: { paidAt: true, totalXof: true } }),
  ]);
  const days = Array.from({ length: 14 }, (_, i) => { const d = new Date(Date.now() - (13 - i) * 86_400_000); return { key: d.toISOString().slice(0, 10), label: d.getDate(), v: 0 }; });
  for (const o of recent) { const k = o.paidAt!.toISOString().slice(0, 10); const d = days.find((x) => x.key === k); if (d) d.v += o.totalXof; }
  const max = Math.max(1, ...days.map((d) => d.v));
  const conv = users ? Math.round((buyers.length / users) * 100) : 0;
  const stats = [
    { l: "Utilisateurs", v: users, i: Users, c: "bg-sky-50 text-sky-700" }, { l: "CV créés", v: cvs, i: FileText, c: "bg-violet-50 text-violet-700" },
    { l: "Commandes payées", v: paid, i: Wallet, c: "bg-brand-50 text-brand-700" }, { l: "Chiffre d’affaires", v: formatXof(revenue._sum.totalXof ?? 0), i: TrendingUp, c: "bg-sun-100 text-amber-700" },
  ];
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-extrabold text-stone-900">Tableau de bord</h1>
      {(review > 0 || newMsgs > 0) && (
        <div className="flex flex-wrap gap-3">
          {review > 0 && <Link href="/admin/commandes?filtre=REVIEW" className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"><AlertTriangle size={17} />{review} paiement{review > 1 ? "s" : ""} à examiner</Link>}
          {newMsgs > 0 && <Link href="/admin/messages" className="flex items-center gap-2 rounded-xl bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700"><Mail size={17} />{newMsgs} nouveau{newMsgs > 1 ? "x" : ""} message{newMsgs > 1 ? "s" : ""}</Link>}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => <div key={s.l} className="card flex items-center gap-4 p-5"><span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${s.c}`}><s.i size={22} /></span><div><p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{s.l}</p><p className="font-display text-2xl font-extrabold">{s.v}</p></div></div>)}
      </div>
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="card p-6">
          <h2 className="font-display text-lg font-bold">Revenus des 14 derniers jours</h2>
          <div className="mt-6 flex h-48 items-end gap-2" role="img" aria-label="Histogramme des revenus">
            {days.map((d) => (
              <div key={d.key} className="group flex flex-1 flex-col items-center gap-1.5">
                <span className="text-[10px] font-semibold text-stone-500 opacity-0 group-hover:opacity-100">{d.v ? d.v : ""}</span>
                <div className="w-full rounded-t-md bg-gradient-to-t from-brand-700 to-brand-400" style={{ height: `${Math.max(3, (d.v / max) * 150)}px`, opacity: d.v ? 1 : 0.2 }} />
                <span className="text-[10px] text-stone-400">{d.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="card p-6">
          <h2 className="font-display text-lg font-bold">Conversion</h2>
          <p className="mt-4 font-display text-5xl font-extrabold text-brand-700">{conv}%</p>
          <p className="mt-2 text-sm text-stone-600">des inscrits ont effectué au moins un achat ({buyers.length} sur {users}).</p>
        </div>
      </div>
    </div>
  );
}
