import { db } from "@/lib/db";
import { createPromo, setPrice, togglePromo, toggleProduct } from "../../actions";

export const dynamic = "force-dynamic";

export default async function Offers() {
  const [products, promos] = await Promise.all([
    db.product.findMany({ orderBy: { sortOrder: "asc" } }),
    db.promoCode.findMany({ orderBy: { code: "asc" }, include: { _count: { select: { redemptions: true } } } }),
  ]);
  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-3xl font-extrabold">Offres et prix</h1>
        <p className="mt-1 text-sm text-stone-600">Les changements de prix s’appliquent aux nouvelles commandes uniquement.</p>
        <div className="card mt-6 divide-y divide-stone-100">
          {products.map((p) => (
            <div key={p.id} className="flex flex-wrap items-center gap-4 p-4">
              <div className="min-w-[200px] flex-1"><p className="font-semibold">{p.name}</p><p className="font-mono text-xs text-stone-500">{p.code}</p></div>
              <form action={setPrice} className="flex items-center gap-2"><input type="hidden" name="code" value={p.code} />
                <input name="price" type="number" min={0} defaultValue={p.priceXof} className="input !w-28" aria-label={`Prix ${p.name}`} /><span className="text-sm text-stone-500">FCFA</span><button className="btn btn-outline btn-sm">Enregistrer</button></form>
              <form action={toggleProduct.bind(null, p.code)}><button className={`badge cursor-pointer ${p.isActive ? "bg-brand-50 text-brand-800" : "bg-stone-100 text-stone-500"}`}>{p.isActive ? "Actif" : "Désactivé"}</button></form>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h2 className="text-2xl font-extrabold">Codes promo</h2>
        <form action={createPromo} className="card mt-5 flex flex-wrap items-end gap-3 p-4">
          <div><label className="label" htmlFor="code">Code</label><input id="code" name="code" required className="input uppercase" placeholder="RENTREE" /></div>
          <div><label className="label" htmlFor="kind">Type</label><select id="kind" name="kind" className="input"><option value="PERCENT">Pourcentage</option><option value="FIXED">Montant fixe</option></select></div>
          <div><label className="label" htmlFor="value">Valeur</label><input id="value" name="value" type="number" min={1} required className="input !w-28" /></div>
          <div><label className="label" htmlFor="maxUses">Utilisations max.</label><input id="maxUses" name="maxUses" type="number" min={1} className="input !w-32" placeholder="illimité" /></div>
          <button className="btn btn-primary">Créer</button>
        </form>
        <div className="card mt-5 overflow-x-auto"><table className="w-full text-sm">
          <thead className="bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-500"><tr><th className="px-4 py-3">Code</th><th className="px-4 py-3">Remise</th><th className="px-4 py-3">Utilisations</th><th className="px-4 py-3">Statut</th></tr></thead>
          <tbody className="divide-y divide-stone-100">{promos.map((p) => (
            <tr key={p.id}><td className="px-4 py-3 font-mono font-bold">{p.code}</td><td className="px-4 py-3">{p.kind === "PERCENT" ? `${p.value} %` : `${p.value} FCFA`}</td><td className="px-4 py-3">{p._count.redemptions}{p.maxUses ? ` / ${p.maxUses}` : ""}</td>
              <td className="px-4 py-3"><form action={togglePromo.bind(null, p.id)}><button className={`badge cursor-pointer ${p.isActive ? "bg-brand-50 text-brand-800" : "bg-stone-100 text-stone-500"}`}>{p.isActive ? "Actif" : "Désactivé"}</button></form></td></tr>
          ))}</tbody></table></div>
      </section>
    </div>
  );
}
