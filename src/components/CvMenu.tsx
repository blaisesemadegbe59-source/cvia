"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { MoreVertical, Copy, Trash2, Check } from "lucide-react";
import { Modal } from "./editor/parts";

export function CvMenu({ id, title }: { id: string; title: string }) {
  const router = useRouter(); const [open, setOpen] = useState(false); const [confirm, setConfirm] = useState(false); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  async function dup() {
    setBusy(true); const r = await fetch(`/api/cvs/${id}/duplicate`, { method: "POST" }); const j = await r.json(); setBusy(false);
    if (r.ok) router.push(`/app/cv/${j.id}`); else { setErr(j.message); setOpen(false); setConfirm(true); }
  }
  async function del() { setBusy(true); await fetch(`/api/cvs/${id}`, { method: "DELETE" }); setConfirm(false); setBusy(false); router.refresh(); }
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} aria-label="Actions" className="rounded-lg p-1.5 text-stone-500 hover:bg-stone-100"><MoreVertical size={18} /></button>
      {open && (
        <div className="absolute right-0 top-9 z-20 w-48 rounded-xl border border-stone-200 bg-white p-1.5 shadow-lift" onMouseLeave={() => setOpen(false)}>
          <button onClick={dup} disabled={busy} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-stone-100"><Copy size={15} />Dupliquer</button>
          <button onClick={() => { setOpen(false); setConfirm(true); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"><Trash2 size={15} />Supprimer</button>
        </div>
      )}
      <Modal open={confirm} onClose={() => { setConfirm(false); setErr(""); }} title={err ? "Impossible" : "Supprimer ce CV ?"}>
        {err ? <p className="text-stone-600">{err}</p> : (
          <>
            <p className="text-[15px] leading-7 text-stone-600">« {title} » sera définitivement supprimé, ainsi que sa photo. Cette action est irréversible.</p>
            <div className="mt-5 flex gap-3"><button className="btn btn-outline flex-1" onClick={() => setConfirm(false)}>Annuler</button><button className="btn btn-danger flex-1" onClick={del} disabled={busy}>Supprimer</button></div>
          </>
        )}
      </Modal>
    </div>
  );
}

export function CopyButton({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard?.writeText(text); setOk(true); setTimeout(() => setOk(false), 1500); }} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline">
      {ok ? <Check size={14} /> : <Copy size={14} />}{ok ? "Lien copié" : "Copier mon lien"}
    </button>
  );
}
