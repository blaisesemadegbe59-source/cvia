import { db } from "@/lib/db";
import { setMessageStatus } from "../../actions";

export const dynamic = "force-dynamic";

export default async function Messages() {
  const msgs = await db.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  const fmt = new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" });
  return (
    <div>
      <h1 className="text-3xl font-extrabold">Messages</h1>
      <div className="mt-6 space-y-3">
        {msgs.length === 0 && <p className="card p-10 text-center text-stone-500">Aucun message.</p>}
        {msgs.map((m) => (
          <article key={m.id} className={`card p-5 ${m.status === "NEW" ? "border-l-4 border-l-brand-600" : ""}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><h2 className="font-display font-bold">{m.subject}</h2><p className="text-sm text-stone-500">{m.name} · {m.email ?? "—"} · {m.phone ?? "—"} · {fmt.format(m.createdAt)}</p></div>
              <form action={setMessageStatus.bind(null, m.id, m.status === "NEW" ? "DONE" : "NEW")}><button className={`badge cursor-pointer ${m.status === "NEW" ? "bg-sun-100 text-amber-800" : "bg-brand-50 text-brand-800"}`}>{m.status === "NEW" ? "Nouveau · marquer traité" : "Traité · rouvrir"}</button></form>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-stone-700">{m.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
