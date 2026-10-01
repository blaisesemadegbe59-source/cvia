"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Loader2, Smartphone, CreditCard, ShieldCheck, FlaskConical, RefreshCw } from "lucide-react";

const OPS = [
  { id: "mtn_open", label: "MTN MoMo", color: "bg-yellow-400 text-stone-900", kind: "momo" },
  { id: "moov", label: "Moov Money", color: "bg-sky-600 text-white", kind: "momo" },
  { id: "sbin", label: "Celtiis Cash", color: "bg-orange-500 text-white", kind: "momo" },
  { id: "card", label: "Carte bancaire", color: "bg-stone-800 text-white", kind: "card" },
] as const;

export function PayPanel({ orderId, initialStatus, demo, defaultPhone }: { orderId: string; initialStatus: string; demo: boolean; defaultPhone: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<string>("mtn_open"); const [phone, setPhone] = useState(defaultPhone);
  const [phase, setPhase] = useState<"form" | "waiting" | "failed">(initialStatus === "PENDING_PAYMENT" ? "waiting" : initialStatus === "FAILED" ? "failed" : "form");
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(""); const [elapsed, setElapsed] = useState(0);
  const ticks = useRef(0);

  // Retour d'une page de paiement hébergée : vérification active auprès de la passerelle.
  useEffect(() => { if (initialStatus === "PENDING_PAYMENT") fetch(`/api/orders/${orderId}/check`, { method: "POST" }).then(() => poll()); /* eslint-disable-next-line */ }, []);

  async function poll() {
    const r = await fetch(`/api/orders/${orderId}/status`); if (!r.ok) return;
    const j = await r.json();
    if (j.status === "PAID") router.refresh();
    else if (j.status === "FAILED" || j.status === "EXPIRED") setPhase("failed");
  }
  useEffect(() => {
    if (phase !== "waiting") return;
    const t = setInterval(async () => {
      ticks.current++; setElapsed((e) => e + 3);
      if (ticks.current % 3 === 0) await fetch(`/api/orders/${orderId}/check`, { method: "POST" });
      await poll();
    }, 3000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  async function pay() {
    setBusy(true); setErr("");
    const r = await fetch(`/api/orders/${orderId}/pay`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ mode, phone }) });
    const j = await r.json(); setBusy(false);
    if (!r.ok) return setErr(j.message);
    if (j.redirectUrl) { window.location.href = j.redirectUrl; return; }
    setElapsed(0); ticks.current = 0; setPhase("waiting");
  }
  async function simulate(outcome: "approved" | "declined") {
    await fetch(`/api/orders/${orderId}/simulate`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ outcome }) });
    await poll(); router.refresh();
  }

  if (phase === "waiting") {
    return (
      <div className="card p-8 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-700"><Smartphone size={30} className="animate-pulse" /></span>
        <h2 className="mt-5 text-2xl font-extrabold">Confirmez sur votre téléphone</h2>
        <p className="mt-2 text-stone-600">Une demande de paiement vient d’être envoyée au <strong>{phone || "numéro indiqué"}</strong>. Saisissez votre code secret pour valider.</p>
        <p className="mt-5 flex items-center justify-center gap-2 text-sm text-stone-500"><Loader2 size={15} className="animate-spin" />En attente de confirmation… {elapsed}s</p>
        {elapsed > 45 && <p className="mt-3 text-sm text-stone-500">Pas de notification ? Vérifiez votre solde et le numéro, ou composez le code USSD de votre opérateur pour valider.</p>}
        {demo && (
          <div className="mt-6 rounded-2xl border-2 border-dashed border-sun-500 bg-sun-100/60 p-4 text-left">
            <p className="flex items-center gap-2 text-sm font-bold text-amber-900"><FlaskConical size={16} />Mode démonstration</p>
            <p className="mt-1 text-xs leading-5 text-amber-900/80">Aucune clé FedaPay n’est configurée : le paiement est simulé. Cliquez pour imiter la réponse de l’opérateur.</p>
            <div className="mt-3 flex gap-2"><button onClick={() => simulate("approved")} className="btn btn-primary btn-sm flex-1">Simuler : accepté</button><button onClick={() => simulate("declined")} className="btn btn-outline btn-sm flex-1">Simuler : refusé</button></div>
          </div>
        )}
        <button onClick={() => setPhase("form")} className="btn btn-ghost btn-sm mt-5">Changer de moyen de paiement</button>
      </div>
    );
  }

  return (
    <div className="card p-6">
      {phase === "failed" && <p className="mb-5 rounded-xl bg-red-50 p-3.5 text-sm text-red-700">Le paiement n’a pas abouti (refusé, annulé ou expiré). Vous n’avez pas été débité ; vous pouvez réessayer.</p>}
      <h2 className="font-display text-lg font-bold">Moyen de paiement</h2>
      <div className="mt-4 grid grid-cols-2 gap-3" role="radiogroup" aria-label="Moyen de paiement">
        {OPS.map((o) => (
          <button key={o.id} role="radio" aria-checked={mode === o.id} onClick={() => setMode(o.id)}
            className={`flex items-center gap-3 rounded-xl border-2 p-3 text-left transition ${mode === o.id ? "border-brand-600 bg-brand-50" : "border-stone-200 hover:border-stone-300"}`}>
            <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${o.color}`}>{o.kind === "card" ? <CreditCard size={17} /> : <Smartphone size={17} />}</span>
            <span className="text-sm font-bold">{o.label}</span>
          </button>
        ))}
      </div>
      {mode !== "card" ? (
        <div className="mt-5">
          <label className="label" htmlFor="phone">Numéro Mobile Money</label>
          <div className="flex"><span className="flex items-center rounded-l-xl border border-r-0 border-stone-300 bg-stone-100 px-3 text-sm font-semibold text-stone-600">🇧🇯 +229</span>
            <input id="phone" inputMode="tel" autoComplete="tel" className="input rounded-l-none" placeholder="01 97 00 00 00" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          <p className="mt-1.5 text-xs text-stone-500">Numéro à 10 chiffres commençant par 01. Les anciens numéros à 8 chiffres sont acceptés.</p>
        </div>
      ) : <p className="mt-5 rounded-xl bg-stone-50 p-3.5 text-sm text-stone-600">Vous serez redirigé vers la page sécurisée de la passerelle pour saisir votre carte.</p>}
      {err && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</p>}
      <button onClick={pay} disabled={busy} className="btn btn-primary btn-lg mt-6 w-full">{busy ? <Loader2 size={18} className="animate-spin" /> : phase === "failed" ? <RefreshCw size={17} /> : null}{phase === "failed" ? "Réessayer le paiement" : "Payer maintenant"}</button>
      <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-stone-500"><ShieldCheck size={14} />Paiement sécurisé par FedaPay. Nous ne voyons jamais votre code secret.</p>
    </div>
  );
}
