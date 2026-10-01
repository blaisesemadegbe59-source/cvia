import Link from "next/link";
import type { Metadata } from "next";
import { Check } from "lucide-react";
import { db } from "@/lib/db";
import { formatXof } from "@/lib/pricing";

export const metadata: Metadata = { title: "Tarifs" };

const FEATURES: Record<string, string[]> = {
  CV_SINGLE: ["PDF sans filigrane", "Téléchargements illimités", "30 jours de modifications", "Lien de partage"],
  CV_PACK_3: ["3 CV à débloquer", "Valable 12 mois", "Économisez 600 FCFA", "Pour plusieurs candidatures"],
  PASS_30: ["Tous vos CV débloqués", "Modifications illimitées", "Tous les modèles", "Idéal en recherche active"],
  PASS_90: ["Tous vos CV débloqués", "Modifications illimitées", "90 jours de sérénité", "Meilleur prix par jour"],
};

export default async function Pricing() {
  const products = await db.product.findMany({ where: { isActive: true, code: { in: Object.keys(FEATURES) } }, orderBy: { sortOrder: "asc" } });
  return (
    <div className="container-x py-14">
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow">Tarifs</p>
        <h1 className="mt-3 text-4xl font-extrabold text-stone-900">Payez uniquement ce dont vous avez besoin</h1>
        <p className="mt-4 text-lg text-stone-600">Créer, modifier et prévisualiser est gratuit. Vous payez pour retirer le filigrane du PDF.</p>
      </div>
      <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {products.map((p) => {
          const star = p.code === "CV_SINGLE";
          return (
            <div key={p.id} className={`relative flex flex-col rounded-3xl p-7 ${star ? "bg-brand-800 text-white shadow-lift ring-4 ring-sun-400/60" : "card"}`}>
              {star && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-sun-400 px-3 py-1 text-xs font-bold text-stone-900">Le plus choisi</span>}
              <h2 className={`text-lg font-bold ${star ? "text-white" : "text-stone-900"}`}>{p.name}</h2>
              <p className="mt-4 font-display text-4xl font-extrabold">{new Intl.NumberFormat("fr-FR").format(p.priceXof).replace(/\u202f/g, " ")}<span className={`ml-1 text-base font-semibold ${star ? "text-brand-200" : "text-stone-500"}`}>FCFA</span></p>
              <p className={`mt-3 text-sm leading-6 ${star ? "text-brand-100" : "text-stone-600"}`}>{p.description}</p>
              <ul className="mt-6 flex-1 space-y-3 text-sm">
                {FEATURES[p.code].map((f) => (
                  <li key={f} className="flex items-start gap-2.5"><Check size={17} className={`mt-0.5 shrink-0 ${star ? "text-sun-300" : "text-brand-600"}`} />{f}</li>
                ))}
              </ul>
              <Link href={`/app/offres?produit=${p.code}`} className={`btn mt-8 w-full ${star ? "btn-sun" : "btn-outline"}`}>Choisir</Link>
            </div>
          );
        })}
      </div>
      <div className="mx-auto mt-14 max-w-3xl rounded-2xl border border-brand-200 bg-brand-50 p-6 text-center text-[15px] leading-7 text-brand-900">
        <strong>Après 30 jours</strong>, vous pouvez prolonger un CV pour <strong>500 FCFA</strong>. Vos CV ne sont jamais supprimés : vous pouvez toujours les modifier et télécharger un PDF avec filigrane gratuitement.
      </div>
    </div>
  );
}
