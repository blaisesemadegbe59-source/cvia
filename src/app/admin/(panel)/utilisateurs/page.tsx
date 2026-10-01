import { db } from "@/lib/db";
import { creditBalance } from "@/lib/orders";
import { grantCredits, toggleUser } from "../../actions";
import { isAdmin, requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Users({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const me = await requireAdmin();
  const users = await db.user.findMany({
    where: q ? { OR: [{ email: { contains: q } }, { name: { contains: q } }, { phone: { contains: q } }] } : undefined,
    orderBy: { createdAt: "desc" }, take: 100, include: { _count: { select: { cvs: true, orders: true } } },
  });
  const balances = await Promise.all(users.map((u) => creditBalance(u.id)));
  const fmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" });
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4"><h1 className="text-3xl font-extrabold">Utilisateurs</h1>
        <form className="flex gap-2"><input name="q" defaultValue={q} placeholder="Rechercher (nom, e-mail, tél.)" className="input w-72" /><button className="btn btn-outline">Rechercher</button></form></div>
      <div className="card mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-500"><tr><th className="px-4 py-3">Utilisateur</th><th className="px-4 py-3">Rôle</th><th className="px-4 py-3">CV</th><th className="px-4 py-3">Commandes</th><th className="px-4 py-3">Crédits</th><th className="px-4 py-3">Inscrit</th><th className="px-4 py-3">Actions</th></tr></thead>
          <tbody className="divide-y divide-stone-100">
            {users.map((u, i) => (
              <tr key={u.id} className={u.status !== "ACTIVE" ? "bg-stone-50 text-stone-400" : ""}>
                <td className="px-4 py-3"><p className="font-semibold text-stone-900">{u.name}</p><p className="text-xs text-stone-500">{u.email}{u.phone ? ` · ${u.phone}` : ""}</p></td>
                <td className="px-4 py-3"><span className={`badge ${u.role === "CANDIDATE" ? "bg-stone-100 text-stone-600" : "bg-stone-900 text-white"}`}>{u.role}</span>{u.status !== "ACTIVE" && <span className="badge ml-1 bg-red-50 text-red-700">{u.status}</span>}</td>
                <td className="px-4 py-3">{u._count.cvs}</td><td className="px-4 py-3">{u._count.orders}</td><td className="px-4 py-3">{balances[i]}</td><td className="px-4 py-3">{fmt.format(u.createdAt)}</td>
                <td className="px-4 py-3">
                  {isAdmin(me) && u.role === "CANDIDATE" && u.status !== "DELETED" && (
                    <div className="flex items-center gap-2">
                      <form action={toggleUser.bind(null, u.id)}><button className="btn btn-outline btn-sm">{u.status === "ACTIVE" ? "Suspendre" : "Réactiver"}</button></form>
                      <form action={grantCredits} className="flex gap-1"><input type="hidden" name="userId" value={u.id} /><input name="n" type="number" min={1} max={20} defaultValue={1} className="input !w-16 !py-1.5" aria-label="Crédits" /><button className="btn btn-ghost btn-sm">+ crédits</button></form>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
