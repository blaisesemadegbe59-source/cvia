"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ShieldCheck } from "lucide-react";

export function TwoFactorSetup({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [data, setData] = useState<{ secret: string; qr: string } | null>(null);
  const [code, setCode] = useState(""); const [err, setErr] = useState(""); const [done, setDone] = useState(enabled);
  async function start() { const r = await fetch("/api/me/2fa", { method: "POST" }); setData(await r.json()); }
  async function confirm() {
    const r = await fetch("/api/me/2fa", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ code }) });
    if (r.ok) { setDone(true); setData(null); router.refresh(); } else setErr((await r.json()).message);
  }
  if (done) return <p className="flex items-center gap-2 font-semibold text-brand-700"><ShieldCheck size={20} />Double authentification activée.</p>;
  if (!data) return <><p className="mb-4 text-sm text-stone-600">La double authentification n’est pas encore activée sur votre compte.</p><button onClick={start} className="btn btn-primary">Activer la double authentification</button></>;
  return (
    <div className="space-y-4">
      <p className="text-sm text-stone-600">1. Scannez ce QR code avec votre application d’authentification.</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={data.qr} alt="QR code 2FA" className="rounded-xl border border-stone-200" width={220} height={220} />
      <p className="text-xs text-stone-500">Ou saisissez la clé : <code className="rounded bg-stone-100 px-1.5 py-0.5">{data.secret}</code></p>
      <p className="text-sm text-stone-600">2. Saisissez le code à 6 chiffres affiché.</p>
      <div className="flex gap-2"><input value={code} onChange={(e) => setCode(e.target.value)} inputMode="numeric" maxLength={6} className="input w-40 tracking-[0.4em]" aria-label="Code" /><button onClick={confirm} className="btn btn-primary">Vérifier</button></div>
      {err && <p className="text-sm text-red-600">{err}</p>}
    </div>
  );
}
