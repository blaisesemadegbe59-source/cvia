"use client";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Check, Loader2, Tag } from "lucide-react";
import { formatXof } from "@/lib/pricing";

type P = { code: string; name: string; description: string; priceXof: number };
type C = { id: string; title: string; unlocked: boolean };

export function OffersClient({ products, cvs, initialProduct, initialCv, credits, hasPass }: { products: P[]; cvs: C[]; initialProduct?: string; initialCv?: string; credits: number; hasPass: boolean }) {
  const router = useRouter();
  const [code, setCode] = useState(products.find((p) => p.code === initialProduct)?.code ?? "CV_SINGLE");
  const needsCv = code === "CV_SINGLE" || code === "CV_REACTIVATE";
  const eligible = useMemo(() => cvs.filter((c) => (code === "CV_REACTIVATE" ? c.unlocked : true)), [cvs, code]);
  const [cvId, setCvId] = useState(initialCv && cvs.some((c) => c.id === initialCv) ? initialCv : "");
  const [promo, setPromo] = useState(""); const [applied, setApplied] = useState<{ code: string; discount: number } | null>(null);
  const [promoMsg, setPromoMsg] = useState(""); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const product = products.find((p) => p.code === code)!;
  const effectiveCv = needsCv ? (eligible.some((c) => c.id === cvId) ? cvId : eligible[0]?.id ?? "") : "";
  const total = product.priceXof - (applied?.discount ?? 0);

  async function validate() {
    if (!promo.trim()) return;
    setPromoMsg("");
    const r = await fetch("/api/promo/validate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code: promo, productCode: code }) });
    const j = await r.json();
    if (r.ok) { setApplied({ code: promo.trim().toUpperCase(), discount: j.discount }); setPromoMsg(`Code appliqué : −${formatXof(j.discount)}`); }
    else { setApplied(null); setPromoMsg(j.message); }
  }
  async function pay() {
    setBusy(true); setErr("");
    const r = await fetch("/api/orders", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ productCode: code, cvId: effectiveCv || null, promo: applied?.code ?? null }) });
    const j = await r.json(); setBusy(false);
    if (!r.ok) return setErr(j.message);
    router.push(`/app/paiement/${j.id}`);
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
      <div className="space-y-3" role="radiogroup" aria-label="Offre">
        {products.map((p) => (
          <button key={p.code} role="radio" aria-checked={code === p.code} onClick={() => { setCode(p.code); setApplied(null); setPromoMsg(""); }}
            className={`flex w-full items-start gap-4 rounded-2xl border-2 bg-white p-5 text-left transition ${code === p.code ? "border-brand-600 shadow-lift" : "border-stone-200 hover:border-stone-300"}`}>
            <span className={`mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${code === p.code ? "border-brand-600 bg-brand-600 text-white" : "border-stone-300"}`}>{code === p.code && <Check size={14} strokeWidth={3} />}</span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-3"><span className="font-display text-lg font-bold text-stone-900">{p.name}</span><span className="font-display text-lg font-extrabold text-brand-800">{formatXof(p.priceXof)}</span></span>
              <span className="mt-1 block text-sm leading-6 text-stone-600">{p.description}</span>
            </span>
          </button>
        ))}
      </div>

      <aside className="card h-fit space-y-5 p-6 lg:sticky lg:top-24">
        <h2 className="font-display text-xl font-extrabold">Récapitulatif</h2>
        {needsCv && (
          <div>
            <label className="label" htmlFor="cv">CV concerné</label>
            {eligible.length === 0 ? <p className="rounded-lg bg-sun-100 p-3 text-sm text-amber-900">{code === "CV_REACTIVATE" ? "Aucun CV débloqué à prolonger." : "Créez d’abord un CV."}</p> : (
              <select id="cv" className="input" value={effectiveCv} onChange={(e) => setCvId(e.target.value)}>{eligible.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select>
            )}
          </div>
        )}
        {(hasPass && code.startsWith("PASS")) && <p className="rounded-lg bg-brand-50 p-3 text-sm text-brand-900">Vous avez déjà un pass actif : la nouvelle période s’ajoutera à la suite.</p>}
        {credits > 0 && code === "CV_SINGLE" && <p className="rounded-lg bg-brand-50 p-3 text-sm text-brand-900">Astuce : vous avez {credits} crédit{credits > 1 ? "s" : ""}. Utilisez-le{credits > 1 ? "s" : ""} depuis l’éditeur, sans payer.</p>}
        <div>
          <label className="label" htmlFor="promo">Code promo</label>
          <div className="flex gap-2"><input id="promo" className="input uppercase" value={promo} onChange={(e) => { setPromo(e.target.value); setApplied(null); }} placeholder="BIENVENUE20" /><button onClick={validate} className="btn btn-outline"><Tag size={15} />OK</button></div>
          {promoMsg && <p className={`mt-1.5 text-sm ${applied ? "text-brand-700" : "text-red-600"}`}>{promoMsg}</p>}
        </div>
        <dl className="space-y-2 border-t border-stone-100 pt-4 text-sm">
          <div className="flex justify-between"><dt className="text-stone-600">{product.name}</dt><dd className="font-semibold">{formatXof(product.priceXof)}</dd></div>
          {applied && <div className="flex justify-between text-brand-700"><dt>Réduction</dt><dd className="font-semibold">−{formatXof(applied.discount)}</dd></div>}
          <div className="flex justify-between border-t border-stone-100 pt-3 text-lg"><dt className="font-bold">Total</dt><dd className="font-display font-extrabold">{formatXof(total)}</dd></div>
        </dl>
        {err && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</p>}
        <button onClick={pay} disabled={busy || (needsCv && !effectiveCv)} className="btn btn-primary btn-lg w-full">{busy && <Loader2 size={18} className="animate-spin" />}{total === 0 ? "Activer gratuitement" : "Continuer vers le paiement"}</button>
        <p className="text-center text-xs text-stone-500">MTN MoMo · Moov Money · Celtiis Cash · Carte</p>
      </aside>
    </div>
  );
}
