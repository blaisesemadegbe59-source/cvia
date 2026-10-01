"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Modal } from "./editor/parts";
import { CopyButton } from "./CvMenu";

async function send(method: string, body: unknown) {
  const r = await fetch("/api/me", { method, headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  return { ok: r.ok, data: await r.json().catch(() => ({})) };
}

export function ProfileClient({ name, email, phone, refUrl, referred }: { name: string; email: string; phone: string; refUrl: string; referred: number }) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [del, setDel] = useState(false); const [delPw, setDelPw] = useState(""); const [delErr, setDelErr] = useState("");

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const f = Object.fromEntries(new FormData(e.currentTarget));
    const { ok, data } = await send("PATCH", f); setMsg({ ok, text: ok ? "Profil mis à jour." : data.message }); if (ok) router.refresh();
  }
  async function changePw(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); const form = e.currentTarget; const f = Object.fromEntries(new FormData(form));
    const { ok, data } = await send("PUT", f); setPwMsg({ ok, text: ok ? "Mot de passe modifié." : data.message }); if (ok) form.reset();
  }
  async function remove() {
    const { ok, data } = await send("DELETE", { password: delPw });
    if (!ok) return setDelErr(data.message);
    router.push("/"); router.refresh();
  }
  const Note = ({ m }: { m: { ok: boolean; text: string } | null }) => m ? <p className={`rounded-lg p-3 text-sm ${m.ok ? "bg-brand-50 text-brand-800" : "bg-red-50 text-red-700"}`}>{m.text}</p> : null;

  return (
    <div className="mt-8 space-y-6">
      <form onSubmit={save} className="card grid gap-4 p-6">
        <h2 className="font-display text-lg font-bold">Informations personnelles</h2>
        <div><label className="label" htmlFor="name">Nom complet</label><input id="name" name="name" defaultValue={name} className="input" required /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label" htmlFor="email">E-mail</label><input id="email" value={email} disabled className="input" /></div>
          <div><label className="label" htmlFor="phone">Téléphone</label><input id="phone" name="phone" defaultValue={phone} className="input" placeholder="01 97 00 00 00" /></div>
        </div>
        <Note m={msg} /><button className="btn btn-primary w-fit">Enregistrer</button>
      </form>

      <form onSubmit={changePw} className="card grid gap-4 p-6">
        <h2 className="font-display text-lg font-bold">Mot de passe</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label" htmlFor="cur">Actuel</label><input id="cur" name="current" type="password" autoComplete="current-password" className="input" required /></div>
          <div><label className="label" htmlFor="new">Nouveau</label><input id="new" name="password" type="password" autoComplete="new-password" className="input" required minLength={8} /></div>
        </div>
        <Note m={pwMsg} /><button className="btn btn-outline w-fit">Modifier le mot de passe</button>
      </form>

      <div className="card p-6">
        <h2 className="font-display text-lg font-bold">Parrainage</h2>
        <p className="mt-1 text-sm text-stone-600">Chaque ami qui achète son premier CV grâce à votre lien vous offre 1 crédit (maximum 5). {referred > 0 ? `${referred} filleul${referred > 1 ? "s" : ""} inscrit${referred > 1 ? "s" : ""}.` : ""}</p>
        <div className="mt-3 break-all rounded-xl bg-stone-50 p-3 text-sm">{refUrl}</div><div className="mt-2"><CopyButton text={refUrl} /></div>
      </div>

      <div className="card border-red-200 p-6">
        <h2 className="font-display text-lg font-bold text-red-700">Supprimer mon compte</h2>
        <p className="mt-1 text-sm text-stone-600">Vos CV, photos et données personnelles seront définitivement supprimés. Les pièces comptables sont conservées de façon anonymisée.</p>
        <button onClick={() => setDel(true)} className="btn btn-outline mt-4 border-red-300 text-red-700 hover:bg-red-50">Supprimer mon compte</button>
      </div>
      <Modal open={del} onClose={() => setDel(false)} title="Confirmer la suppression">
        <p className="text-sm text-stone-600">Saisissez votre mot de passe pour confirmer. Cette action est irréversible.</p>
        <input type="password" className="input mt-4" placeholder="Mot de passe" value={delPw} onChange={(e) => setDelPw(e.target.value)} />
        {delErr && <p className="mt-2 text-sm text-red-600">{delErr}</p>}
        <div className="mt-5 flex gap-3"><button className="btn btn-outline flex-1" onClick={() => setDel(false)}>Annuler</button><button className="btn btn-danger flex-1" onClick={remove}>Supprimer</button></div>
      </Modal>
    </div>
  );
}
