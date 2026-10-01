"use client";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";

export function ContactForm() {
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending"); setError("");
    const body = Object.fromEntries(new FormData(e.currentTarget));
    const r = await fetch("/api/contact", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (r.ok) setState("done");
    else { setState("idle"); setError((await r.json()).message); }
  }
  if (state === "done") {
    return (
      <div className="py-10 text-center">
        <CheckCircle2 size={48} className="mx-auto text-brand-600" />
        <h2 className="mt-4 text-xl font-bold">Message envoyé</h2>
        <p className="mt-2 text-stone-600">Merci ! Nous vous répondons très vite.</p>
      </div>
    );
  }
  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div><label className="label" htmlFor="name">Nom</label><input id="name" name="name" className="input" required /></div>
        <div><label className="label" htmlFor="phone">Téléphone (optionnel)</label><input id="phone" name="phone" inputMode="tel" className="input" placeholder="01 97 00 00 00" /></div>
      </div>
      <div><label className="label" htmlFor="email">E-mail</label><input id="email" name="email" type="email" className="input" /></div>
      <div><label className="label" htmlFor="subject">Sujet</label><input id="subject" name="subject" className="input" required /></div>
      <div><label className="label" htmlFor="body">Message</label><textarea id="body" name="body" rows={5} className="input" required /></div>
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button disabled={state === "sending"} className="btn btn-primary btn-lg">{state === "sending" ? "Envoi…" : "Envoyer le message"}</button>
    </form>
  );
}
