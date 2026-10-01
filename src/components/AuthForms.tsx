"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";

async function post(url: string, body: unknown) {
  const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const data = await r.json().catch(() => ({}));
  return { ok: r.ok, data };
}

function PasswordInput({ id = "password", name = "password", autoComplete }: { id?: string; name?: string; autoComplete: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input id={id} name={name} type={show ? "text" : "password"} autoComplete={autoComplete} required minLength={8} className="input pr-11" />
      <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Masquer" : "Afficher"} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-stone-500 hover:bg-stone-100">
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

const Err = ({ msg }: { msg: string }) => (msg ? <p role="alert" className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{msg}</p> : null);
const Submit = ({ busy, children }: { busy: boolean; children: React.ReactNode }) => (
  <button disabled={busy} className="btn btn-primary btn-lg w-full">{busy && <Loader2 size={18} className="animate-spin" />}{children}</button>
);

const safeNext = (n: string | null | undefined, fallback: string) => (n && n.startsWith("/") && !n.startsWith("//") ? n : fallback);

export function LoginForm({ next, admin = false }: { next?: string; admin?: boolean }) {
  const router = useRouter();
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const [need2fa, setNeed2fa] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError("");
    const f = new FormData(e.currentTarget);
    const { ok, data } = await post("/api/auth/login", { email: f.get("email"), password: f.get("password"), code: f.get("code") || undefined });
    setBusy(false);
    if (!ok) { setNeed2fa(Boolean(data.need2fa)); setError(data.message || "Erreur de connexion."); return; }
    const staff = ["ADMIN", "SUPERADMIN", "SUPPORT"].includes(data.role);
    router.push(safeNext(next, admin || staff ? "/admin" : "/app")); router.refresh();
  }
  return (
    <>
      <h1 className="text-3xl font-extrabold text-stone-900">{admin ? "Espace administration" : "Bon retour 👋"}</h1>
      <p className="mt-2 text-stone-600">{admin ? "Connexion réservée à l’équipe." : "Connectez-vous pour retrouver vos CV."}</p>
      <form onSubmit={submit} className="mt-8 grid gap-4">
        <div><label className="label" htmlFor="email">Adresse e-mail</label><input id="email" name="email" type="email" autoComplete="email" required className="input" /></div>
        <div>
          <div className="flex items-center justify-between"><label className="label" htmlFor="password">Mot de passe</label>
            {!admin && <Link href="/mot-de-passe-oublie" className="mb-1.5 text-[13px] font-medium text-brand-700 hover:underline">Oublié ?</Link>}</div>
          <PasswordInput autoComplete="current-password" />
        </div>
        {need2fa && <div><label className="label" htmlFor="code">Code de double authentification</label><input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} className="input tracking-[0.4em]" autoFocus /></div>}
        <Err msg={error} />
        <Submit busy={busy}>Se connecter</Submit>
      </form>
      {!admin && <p className="mt-6 text-center text-sm text-stone-600">Pas encore de compte ? <Link href={`/inscription${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-brand-700 hover:underline">Créer un compte</Link></p>}
    </>
  );
}

export function RegisterForm({ next, refCode }: { next?: string; refCode?: string }) {
  const router = useRouter();
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError("");
    const f = Object.fromEntries(new FormData(e.currentTarget));
    const { ok, data } = await post("/api/auth/register", { ...f, ref: refCode });
    setBusy(false);
    if (!ok) { setError(data.message || "Inscription impossible."); return; }
    router.push(safeNext(next, "/app")); router.refresh();
  }
  return (
    <>
      <h1 className="text-3xl font-extrabold text-stone-900">Créez votre compte</h1>
      <p className="mt-2 text-stone-600">Gratuit. Vos brouillons sont conservés.</p>
      <form onSubmit={submit} className="mt-8 grid gap-4">
        <div><label className="label" htmlFor="name">Nom complet</label><input id="name" name="name" autoComplete="name" required className="input" placeholder="Awa Adjovi" /></div>
        <div><label className="label" htmlFor="email">Adresse e-mail</label><input id="email" name="email" type="email" autoComplete="email" required className="input" /></div>
        <div><label className="label" htmlFor="phone">Téléphone <span className="font-normal text-stone-400">(optionnel)</span></label><input id="phone" name="phone" inputMode="tel" autoComplete="tel" className="input" placeholder="01 97 00 00 00" /></div>
        <div><label className="label" htmlFor="password">Mot de passe</label><PasswordInput autoComplete="new-password" /><p className="mt-1.5 text-xs text-stone-500">8 caractères minimum.</p></div>
        <Err msg={error} />
        <Submit busy={busy}>Créer mon compte</Submit>
        <p className="text-center text-xs leading-5 text-stone-500">En continuant, vous acceptez nos <Link href="/legal/cgv" className="underline">conditions</Link> et notre <Link href="/legal/confidentialite" className="underline">politique de confidentialité</Link>.</p>
      </form>
      <p className="mt-6 text-center text-sm text-stone-600">Déjà inscrit ? <Link href={`/connexion${next ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-brand-700 hover:underline">Se connecter</Link></p>
    </>
  );
}

export function ForgotForm() {
  const [done, setDone] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [dev, setDev] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError("");
    const { ok, data } = await post("/api/auth/forgot", { email: new FormData(e.currentTarget).get("email") });
    setBusy(false);
    if (!ok) return setError(data.message || "Erreur.");
    setDone(true); setDev(data.devLink || "");
  }
  return (
    <>
      <h1 className="text-3xl font-extrabold text-stone-900">Mot de passe oublié</h1>
      {done ? (
        <div className="mt-6 space-y-4">
          <p className="rounded-xl bg-brand-50 p-4 text-sm leading-6 text-brand-900">Si un compte existe avec cette adresse, un lien de réinitialisation vient d’être envoyé (valable 1 heure).</p>
          {dev && <p className="rounded-xl border border-dashed border-sun-500 bg-sun-100 p-4 text-sm leading-6">Mode développement : aucun e-mail n’est réellement envoyé. <a href={dev} className="font-semibold underline">Ouvrir le lien de réinitialisation</a></p>}
        </div>
      ) : (
        <>
          <p className="mt-2 text-stone-600">Indiquez votre e-mail, nous vous envoyons un lien.</p>
          <form onSubmit={submit} className="mt-8 grid gap-4">
            <div><label className="label" htmlFor="email">Adresse e-mail</label><input id="email" name="email" type="email" required className="input" /></div>
            <Err msg={error} /><Submit busy={busy}>Envoyer le lien</Submit>
          </form>
        </>
      )}
      <p className="mt-6 text-center text-sm"><Link href="/connexion" className="font-semibold text-brand-700 hover:underline">← Retour à la connexion</Link></p>
    </>
  );
}

export function ResetForm({ token }: { token: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError("");
    const { ok, data } = await post("/api/auth/reset", { token, password: new FormData(e.currentTarget).get("password") });
    setBusy(false);
    if (!ok) return setError(data.message || "Erreur.");
    router.push("/connexion?reset=1");
  }
  return (
    <>
      <h1 className="text-3xl font-extrabold text-stone-900">Nouveau mot de passe</h1>
      <form onSubmit={submit} className="mt-8 grid gap-4">
        <div><label className="label" htmlFor="password">Nouveau mot de passe</label><PasswordInput autoComplete="new-password" /></div>
        <Err msg={error} /><Submit busy={busy}>Enregistrer</Submit>
      </form>
    </>
  );
}
