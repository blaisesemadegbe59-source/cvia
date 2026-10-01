import type { Metadata } from "next";
import { ChevronDown } from "lucide-react";

export const metadata: Metadata = { title: "Questions fréquentes" };

const FAQ = [
  ["Est-ce vraiment gratuit pour essayer ?", "Oui. Vous pouvez créer votre CV, voir l’aperçu en direct, l’enregistrer et télécharger un PDF avec un filigrane discret, sans payer. Vous payez seulement pour obtenir le PDF net, sans filigrane."],
  ["Comment payer ?", "Par Mobile Money (MTN MoMo, Moov Money, Celtiis Cash) ou par carte bancaire via FedaPay. Pour Mobile Money, saisissez votre numéro : une demande de confirmation arrive sur votre téléphone. Il suffit de saisir votre code secret."],
  ["Que comprend le paiement de 1 200 FCFA ?", "Le PDF sans filigrane de ce CV, des téléchargements illimités et 30 jours pour le modifier et le retélécharger. Après 30 jours, vous gardez votre dernier PDF et pouvez prolonger pour 500 FCFA."],
  ["J’ai payé mais mon CV est toujours avec filigrane.", "Patientez une minute puis actualisez la page de paiement : la confirmation de l’opérateur peut prendre un moment. Si le problème persiste, écrivez-nous avec le numéro de commande, nous réglons le cas rapidement."],
  ["Puis-je modifier mon CV après avoir payé ?", "Oui, pendant 30 jours, autant de fois que vous voulez. Vos informations restent toujours modifiables ; seule la version PDF sans filigrane est liée à la période payée."],
  ["Mes informations sont-elles protégées ?", "Votre CV est privé par défaut. Vous seul y avez accès, sauf si vous créez un lien de partage, que vous pouvez désactiver à tout moment. Vous pouvez supprimer votre compte et toutes vos données depuis votre profil."],
  ["Je n’ai pas d’ordinateur. Est-ce utilisable sur téléphone ?", "Oui, l’application est pensée d’abord pour smartphone : formulaire par étapes, aperçu en un clic, enregistrement automatique."],
  ["Puis-je avoir plusieurs CV ?", "Jusqu’à 10 CV par compte. Le Pack 3 CV et les Pass illimités sont faits pour ceux qui postulent à plusieurs types d’emplois."],
];

export default function Faq() {
  return (
    <div className="container-x max-w-3xl py-14">
      <p className="eyebrow text-center">Aide</p>
      <h1 className="mt-3 text-center text-4xl font-extrabold text-stone-900">Questions fréquentes</h1>
      <div className="mt-12 space-y-3">
        {FAQ.map(([q, a]) => (
          <details key={q} className="card group p-5 open:shadow-lift">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-[17px] font-bold text-stone-900">
              {q}<ChevronDown size={20} className="shrink-0 text-brand-700 transition group-open:rotate-180" />
            </summary>
            <p className="mt-3 text-[15px] leading-7 text-stone-600">{a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
