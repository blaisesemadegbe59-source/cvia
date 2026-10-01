import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Audit() {
  const logs = await db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 150 });
  const actors = await db.user.findMany({ where: { id: { in: logs.map((l) => l.actorId).filter(Boolean) as string[] } }, select: { id: true, email: true } });
  const by = Object.fromEntries(actors.map((a) => [a.id, a.email]));
  const fmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeStyle: "medium" });
  return (
    <div>
      <h1 className="text-3xl font-extrabold">Journal d’audit</h1>
      <div className="card mt-6 overflow-x-auto"><table className="w-full text-sm">
        <thead className="bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-500"><tr><th className="px-4 py-3">Date</th><th className="px-4 py-3">Acteur</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Objet</th><th className="px-4 py-3">Détail</th><th className="px-4 py-3">IP</th></tr></thead>
        <tbody className="divide-y divide-stone-100">{logs.map((l) => (
          <tr key={l.id}><td className="whitespace-nowrap px-4 py-2.5 text-stone-600">{fmt.format(l.createdAt)}</td><td className="px-4 py-2.5">{l.actorId ? by[l.actorId] ?? l.actorId : "système"}</td>
            <td className="px-4 py-2.5 font-mono text-xs font-bold">{l.action}</td><td className="px-4 py-2.5 text-xs">{l.entity}{l.entityId ? ` · ${l.entityId.slice(0, 10)}` : ""}</td><td className="px-4 py-2.5 font-mono text-xs text-stone-500">{l.detail}</td><td className="px-4 py-2.5 text-xs text-stone-500">{l.ip}</td></tr>
        ))}</tbody></table></div>
    </div>
  );
}
