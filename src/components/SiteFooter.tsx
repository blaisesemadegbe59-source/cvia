import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { Logo, APP_NAME } from "./Logo";
import { getSettings } from "@/lib/settings";

export async function SiteFooter() {
  const s = await getSettings();
  const waUrl = "https://wa.me/+2290195978819";
  return (
    <footer className="mt-24 bg-brand-950 text-brand-100">
      <div className="container-x grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo light />
          <p className="mt-4 max-w-xs text-sm leading-6 text-brand-200/80">Le CV professionnel, fait pour le Bénin : simple sur téléphone, payable par Mobile Money, prêt à envoyer en PDF.</p>
          <a href={waUrl} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/15">
            <MessageCircle size={17} /> Écrire sur WhatsApp
          </a>
        </div>
        <FooterCol title="Produit" links={[["/modeles", "Modèles"], ["/tarifs", "Tarifs"], ["/creer", "Créer mon CV"], ["/faq", "Questions fréquentes"]]} />
        <FooterCol title="Compte" links={[["/connexion", "Connexion"], ["/inscription", "Inscription"], ["/app", "Mes CV"], ["/contact", "Contact"]]} />
        <FooterCol title="Légal" links={[["/legal/mentions-legales", "Mentions légales"], ["/legal/confidentialite", "Confidentialité"], ["/legal/cgv", "Conditions de vente"]]} />
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-5 text-xs text-brand-200/70 sm:flex-row">
          <span>© {new Date().getFullYear()} {APP_NAME}. Tous droits réservés.</span>
          <span>Paiements sécurisés par FedaPay · MTN MoMo · Moov Money · Celtiis Cash</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h4 className="mb-4 text-sm font-bold uppercase tracking-wider text-white">{title}</h4>
      <ul className="space-y-2.5 text-sm">
        {links.map(([h, l]) => <li key={h}><Link href={h} className="text-brand-200/80 transition hover:text-white">{l}</Link></li>)}
      </ul>
    </div>
  );
}
