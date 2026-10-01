import { notFound } from "next/navigation";
import { APP_NAME } from "@/components/Logo";

const PAGES: Record<string, { title: string; body: React.ReactNode }> = {
  "mentions-legales": {
    title: "Mentions légales",
    body: (<>
      <p>Le site {APP_NAME} est édité par <strong>[Raison sociale à compléter]</strong>, [forme juridique], immatriculée sous le numéro IFU [à compléter], dont le siège est situé à [adresse], Bénin.</p>
      <h2>Directeur de la publication</h2><p>[Nom du représentant légal à compléter].</p>
      <h2>Hébergement</h2><p>[Nom et adresse de l’hébergeur à compléter].</p>
      <h2>Contact</h2><p>Via la page Contact du site.</p>
      <p className="mt-6 rounded-lg bg-sun-100 p-3 text-sm">⚠️ Texte de démonstration : à faire valider par un conseil juridique avant mise en production.</p>
    </>),
  },
  confidentialite: {
    title: "Politique de confidentialité",
    body: (<>
      <p>Cette politique décrit les données personnelles que nous collectons et pourquoi, conformément à la loi n° 2017-20 du Code du numérique (Bénin).</p>
      <h2>Données collectées</h2>
      <ul><li>Compte : nom, e-mail, téléphone, mot de passe (stocké haché).</li><li>CV : le contenu que vous saisissez et votre photo (nettoyée de ses métadonnées).</li><li>Paiement : référence de transaction et statut. Nous ne voyons jamais votre code Mobile Money ni votre carte.</li></ul>
      <h2>Finalités</h2><p>Fournir le service, traiter vos paiements, vous assister et sécuriser la plateforme. Aucune donnée n’est vendue.</p>
      <h2>Vos droits</h2><p>Accès, rectification et suppression : depuis votre profil (suppression du compte et des CV) ou via la page Contact.</p>
      <h2>Conservation</h2><p>Vos CV sont conservés tant que votre compte existe. Les pièces comptables sont conservées selon les obligations légales.</p>
      <p className="mt-6 rounded-lg bg-sun-100 p-3 text-sm">⚠️ Texte de démonstration : déclaration à l’APDP et validation juridique requises avant mise en production.</p>
    </>),
  },
  cgv: {
    title: "Conditions générales de vente",
    body: (<>
      <h2>Offres</h2><p>Les prix sont indiqués en francs CFA (XOF), toutes taxes comprises. La création, l’aperçu et l’enregistrement d’un CV sont gratuits ; le téléchargement sans filigrane est payant.</p>
      <h2>Droits obtenus après paiement</h2><p>Le paiement d’un CV à l’unité donne accès au PDF sans filigrane, aux téléchargements illimités et aux modifications pendant 30 jours. Un Pass illimité débloque tous vos CV pendant sa durée. Un Pack contient des crédits valables 12 mois.</p>
      <h2>Livraison</h2><p>Le service est numérique et accessible immédiatement après confirmation du paiement par l’opérateur.</p>
      <h2>Remboursement</h2><p>Un paiement ayant échoué techniquement ou débité deux fois est remboursé après vérification. Le service numérique pleinement fourni n’est pas remboursable.</p>
      <p className="mt-6 rounded-lg bg-sun-100 p-3 text-sm">⚠️ Texte de démonstration : à faire valider avant mise en production.</p>
    </>),
  },
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const p = PAGES[(await params).slug];
  return { title: p?.title };
}

export default async function Legal({ params }: { params: Promise<{ slug: string }> }) {
  const p = PAGES[(await params).slug];
  if (!p) notFound();
  return (
    <div className="container-x max-w-3xl py-14">
      <h1 className="text-4xl font-extrabold text-stone-900">{p.title}</h1>
      <div className="prose-legal mt-8 card p-7 sm:p-10">{p.body}</div>
    </div>
  );
}
