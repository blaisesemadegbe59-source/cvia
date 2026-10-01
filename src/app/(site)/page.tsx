import Link from "next/link";
import { ArrowRight, Check, Smartphone, Eye, FileDown, ShieldCheck, Palette, Share2, Zap, Wallet, Sparkles } from "lucide-react";
import { TemplatePreview } from "@/components/TemplatePreview";
import { sampleContent } from "@/lib/cv-schema";
import { db } from "@/lib/db";
import { formatXof } from "@/lib/pricing";

export default async function Home() {
  const content = sampleContent();
  const templates = await db.template.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" }, take: 4 });
  const single = await db.product.findUnique({ where: { code: "CV_SINGLE" } });
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-stone-50 to-stone-50">
        <div className="pattern-dots absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black,transparent_70%)]" />
        <div className="absolute -right-32 -top-32 h-[520px] w-[520px] rounded-full bg-brand-200/50 blur-3xl" />
        <div className="absolute -left-24 top-60 h-72 w-72 rounded-full bg-sun-300/30 blur-3xl" />
        <div className="container-x relative grid items-center gap-12 pb-20 pt-12 md:pt-20 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-brand-800 shadow-sm">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-white"><Sparkles size={10} /></span>
              Aperçu 100 % gratuit · Payez seulement quand il est parfait
            </span>
            <h1 className="mt-6 text-[2.5rem] font-extrabold leading-[1.05] text-stone-900 sm:text-6xl">
              Votre CV professionnel,<br />
              <span className="relative whitespace-nowrap text-brand-700">
                prêt en 10 minutes
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none" preserveAspectRatio="none" aria-hidden><path d="M2 8c60-6 140-8 296-2" stroke="#facc15" strokeWidth="5" strokeLinecap="round" /></svg>
              </span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-stone-600">
              Remplissez un formulaire simple depuis votre téléphone, voyez votre CV se construire en direct, puis téléchargez un PDF A4 propre et prêt à envoyer. Payable par <strong className="text-stone-800">MTN MoMo, Moov Money ou Celtiis Cash</strong>.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/creer" className="btn btn-primary btn-lg shadow-lift">Créer mon CV gratuitement <ArrowRight size={18} /></Link>
              <Link href="/modeles" className="btn btn-outline btn-lg">Voir les modèles</Link>
            </div>
            <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-sm text-stone-600">
              {["Sans inscription pour essayer", `PDF sans filigrane dès ${single ? formatXof(single.priceXof) : "1 200 FCFA"}`, "Fait pour le Bénin"].map((t) => (
                <li key={t} className="flex items-center gap-2"><Check size={16} className="text-brand-600" />{t}</li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-[440px]">
            <div className="absolute inset-0 -rotate-6 rounded-3xl bg-brand-700/90 shadow-lift" />
            <div className="absolute inset-0 rotate-3 rounded-3xl bg-sun-400/90" />
            <div className="relative overflow-hidden rounded-2xl bg-white shadow-lift ring-1 ring-black/5">
              <TemplatePreview slug="moderne" content={content} style={{ accent: "#0B6B4F" }} />
            </div>
            <div className="absolute -left-6 bottom-16 animate-float rounded-2xl bg-white px-4 py-3 shadow-lift ring-1 ring-black/5">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-brand-700"><Check size={18} strokeWidth={3} /></span>
                <div><p className="text-sm font-bold text-stone-900">Paiement confirmé</p><p className="text-xs text-stone-500">MTN MoMo · 1 200 FCFA</p></div>
              </div>
            </div>
            <div className="absolute -right-10 -top-5 animate-float rounded-2xl bg-white px-4 py-3 shadow-lift ring-1 ring-black/5 [animation-delay:1.5s]">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50 text-red-600"><FileDown size={18} /></span>
                <div><p className="text-sm font-bold text-stone-900">CV_Awa_Adjovi.pdf</p><p className="text-xs text-stone-500">A4 · 1 page</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ÉTAPES */}
      <section className="container-x py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Comment ça marche</p>
          <h2 className="mt-3 text-3xl font-extrabold text-stone-900 sm:text-4xl">De zéro à un CV impeccable en 3 étapes</h2>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {[
            { n: "1", icon: Palette, t: "Choisissez un modèle", d: "Des modèles sobres et lisibles, testés pour être imprimés et lus par les recruteurs." },
            { n: "2", icon: Smartphone, t: "Remplissez, c’est tout", d: "Un formulaire guidé, pensé pour le téléphone. Votre CV se met en page automatiquement, en direct." },
            { n: "3", icon: FileDown, t: "Téléchargez le PDF", d: "Payez par Mobile Money, puis téléchargez un PDF A4 net, sans filigrane, quand vous voulez." },
          ].map((s) => (
            <div key={s.n} className="card relative p-7">
              <span className="absolute right-6 top-5 font-display text-6xl font-extrabold text-brand-100">{s.n}</span>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 ring-1 ring-brand-100"><s.icon size={22} /></span>
              <h3 className="mt-5 text-lg font-bold text-stone-900">{s.t}</h3>
              <p className="mt-2 text-[15px] leading-7 text-stone-600">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MODÈLES */}
      <section className="bg-white py-20">
        <div className="container-x">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow">Modèles</p>
              <h2 className="mt-3 text-3xl font-extrabold text-stone-900 sm:text-4xl">Un design qui inspire confiance</h2>
              <p className="mt-3 max-w-xl text-stone-600">Couleurs et polices modifiables en un clic. Le rendu que vous voyez est exactement celui du PDF.</p>
            </div>
            <Link href="/modeles" className="btn btn-outline">Tous les modèles <ArrowRight size={16} /></Link>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {templates.map((t, i) => (
              <Link key={t.id} href={`/creer?modele=${t.slug}`} className="group">
                <div className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-100 p-3 shadow-soft transition duration-300 group-hover:-translate-y-1.5 group-hover:shadow-lift">
                  <div className="overflow-hidden rounded-lg bg-white shadow-sm">
                    <TemplatePreview slug={t.slug} content={content} style={{ accent: ["#0B6B4F", "#1D4ED8", "#0F766E", "#334155"][i % 4] }} />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between px-1">
                  <span className="font-display font-bold text-stone-900">{t.name}</span>
                  <span className="text-sm font-semibold text-brand-700 opacity-0 transition group-hover:opacity-100">Utiliser →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* AVANTAGES */}
      <section className="container-x py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Pourquoi nous</p>
          <h2 className="mt-3 text-3xl font-extrabold text-stone-900 sm:text-4xl">Simple, honnête, adapté ici</h2>
        </div>
        <div className="mt-14 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { i: Wallet, t: "Mobile Money natif", d: "MTN MoMo, Moov Money, Celtiis Cash ou carte bancaire. Aucune carte requise." },
            { i: Eye, t: "Aperçu en direct", d: "Chaque lettre tapée apparaît sur votre CV. Testez gratuitement avant de payer." },
            { i: Zap, t: "Léger et rapide", d: "Pensé pour les connexions mobiles : vos modifications sont enregistrées automatiquement." },
            { i: ShieldCheck, t: "Vos données protégées", d: "Photo nettoyée, lien de partage révocable, suppression du compte à tout moment." },
            { i: Share2, t: "Lien de partage", d: "Envoyez un lien web de votre CV par WhatsApp, avec ou sans vos coordonnées." },
            { i: FileDown, t: "30 jours pour retoucher", d: "Après paiement, modifiez et retéléchargez votre CV autant de fois que vous voulez pendant 30 jours." },
          ].map((f) => (
            <div key={f.t} className="flex gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-700 text-white shadow-sm"><f.i size={20} /></span>
              <div><h3 className="font-bold text-stone-900">{f.t}</h3><p className="mt-1 text-[15px] leading-7 text-stone-600">{f.d}</p></div>
            </div>
          ))}
        </div>
      </section>

      {/* TARIF */}
      <section className="container-x pb-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-800 to-brand-950 px-6 py-14 text-center text-white shadow-lift sm:px-12">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand-500/30 blur-3xl" />
          <div className="absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-sun-400/20 blur-3xl" />
          <div className="relative">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-sun-300">Un prix clair</p>
            <p className="mt-4 font-display text-6xl font-extrabold sm:text-7xl">{single ? new Intl.NumberFormat("fr-FR").format(single.priceXof).replace(/\u202f/g, " ") : "1 200"} <span className="text-3xl font-bold text-brand-200">FCFA</span></p>
            <p className="mx-auto mt-4 max-w-xl text-lg text-brand-100">par CV : PDF sans filigrane, téléchargements illimités et 30 jours de modifications. Pas d’abonnement caché.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/creer" className="btn btn-sun btn-lg">Commencer gratuitement</Link>
              <Link href="/tarifs" className="btn btn-lg border border-white/25 text-white hover:bg-white/10">Voir packs et pass</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
